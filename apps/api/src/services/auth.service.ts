import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '../db';
import { config } from '../config';
import { signAccessToken, generateRefreshToken, hashToken } from '../utils/jwt';
import { AppError } from '../middleware/error.handler';
import { normalizePhone } from '@babloo/shared';
import { AUTH } from '../constants/errors';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

function issueAccessToken(user: { id: string; role: string; locale: string }): string {
  return signAccessToken({ userId: user.id, role: user.role, locale: user.locale });
}

async function createRefreshToken(userId: string, family: string): Promise<string> {
  const raw = generateRefreshToken();
  const hash = hashToken(raw);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);
  await prisma.refreshToken.create({
    data: { userId, tokenHash: hash, family, expiresAt },
  });
  return raw;
}

function generateFamily(): string {
  return crypto.randomUUID();
}

export async function signup(input: {
  email?: string;
  phone?: string;
  password?: string;
  fullName: string;
}): Promise<TokenPair> {
  const phone = input.phone ? normalizePhone(input.phone) : undefined;

  if (input.email) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw new AppError(409, 'DUPLICATE', AUTH.DUPLICATE_EMAIL);
  }
  if (phone) {
    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing) throw new AppError(409, 'DUPLICATE', AUTH.DUPLICATE_PHONE);
  }

  const passwordHash = input.password
    ? await bcrypt.hash(input.password, config.bcrypt.rounds)
    : null;

  const user = await prisma.user.create({
    data: {
      email: input.email ?? null,
      phone: phone ?? null,
      passwordHash,
      fullName: input.fullName,
    },
  });

  const family = generateFamily();
  const accessToken = issueAccessToken(user);
  const refreshToken = await createRefreshToken(user.id, family);
  return { accessToken, refreshToken };
}

export async function login(email: string, password: string): Promise<TokenPair> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash || !user.isActive) {
    throw new AppError(401, 'INVALID_CREDENTIALS', AUTH.INVALID_CREDENTIALS);
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new AppError(401, 'INVALID_CREDENTIALS', AUTH.INVALID_CREDENTIALS);
  }
  const family = generateFamily();
  const accessToken = issueAccessToken(user);
  const refreshToken = await createRefreshToken(user.id, family);
  return { accessToken, refreshToken };
}

export async function otpRequest(phone: string, purpose: string): Promise<{ challengeId: string }> {
  const normalized = normalizePhone(phone);

  // DB-backed throttle: authoritative gate
  const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000);
  const recentCount = await prisma.otpChallenge.count({
    where: { phone: normalized, createdAt: { gte: fifteenMinAgo } },
  });
  if (recentCount >= config.otp.rateLimitPer15Min) {
    throw new AppError(429, 'OTP_RATE_LIMIT', AUTH.OTP_RATE_LIMIT);
  }

  const code = config.isDev
    ? config.otp.devBypassCode
    : String(Math.floor(100000 + Math.random() * 900000));

  const codeHash = await bcrypt.hash(code, config.bcrypt.rounds);
  const expiresAt = new Date(Date.now() + config.otp.ttlMinutes * 60 * 1000);

  const challenge = await prisma.otpChallenge.create({
    data: { phone: normalized, purpose: purpose as any, codeHash, expiresAt },
  });

  if (config.isDev) {
    console.log(`[dev-otp] phone=${normalized} code=${code}`);
  }

  return { challengeId: challenge.id };
}

export async function otpVerify(
  challengeId: string,
  code: string,
  fullName?: string,
): Promise<TokenPair> {
  // Atomic attempt increment — prevents TOCTOU race on attempt limit.
  // If 0 rows updated the challenge is invalid, expired, consumed, or exhausted.
  const { count } = await prisma.otpChallenge.updateMany({
    where: {
      id: challengeId,
      consumedAt: null,
      attempts: { lt: config.otp.maxAttempts },
      expiresAt: { gt: new Date() },
    },
    data: { attempts: { increment: 1 } },
  });

  if (count === 0) {
    throw new AppError(401, 'INVALID_CREDENTIALS', AUTH.INVALID_CREDENTIALS);
  }

  // Re-fetch to get codeHash and phone (updateMany doesn't return the row)
  const challenge = await prisma.otpChallenge.findUnique({
    where: { id: challengeId },
  });

  if (!challenge) {
    throw new AppError(401, 'INVALID_CREDENTIALS', AUTH.INVALID_CREDENTIALS);
  }

  const valid = await bcrypt.compare(code, challenge.codeHash);
  if (!valid) {
    throw new AppError(401, 'INVALID_CREDENTIALS', AUTH.INVALID_CREDENTIALS);
  }

  await prisma.otpChallenge.update({
    where: { id: challenge.id },
    data: { consumedAt: new Date() },
  });

  let user = await prisma.user.findUnique({ where: { phone: challenge.phone } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        phone: challenge.phone,
        fullName: fullName?.trim() || challenge.phone,
      },
    });
  }

  if (!user.isActive) {
    throw new AppError(401, 'INVALID_CREDENTIALS', AUTH.INVALID_CREDENTIALS);
  }

  const family = generateFamily();
  const accessToken = issueAccessToken(user);
  const refreshToken = await createRefreshToken(user.id, family);
  return { accessToken, refreshToken };
}

export async function refresh(rawRefreshToken: string): Promise<TokenPair> {
  const hash = hashToken(rawRefreshToken);
  const token = await prisma.refreshToken.findUnique({
    where: { tokenHash: hash },
    include: { user: true },
  });

  if (!token) {
    throw new AppError(401, 'INVALID_CREDENTIALS', AUTH.INVALID_CREDENTIALS);
  }

  if (token.isRevoked) {
    await prisma.refreshToken.updateMany({
      where: { family: token.family },
      data: { isRevoked: true },
    });
    throw new AppError(401, 'TOKEN_REUSE', AUTH.INVALID_CREDENTIALS);
  }

  if (token.expiresAt < new Date()) {
    throw new AppError(401, 'INVALID_CREDENTIALS', AUTH.INVALID_CREDENTIALS);
  }

  if (!token.user.isActive) {
    throw new AppError(401, 'INVALID_CREDENTIALS', AUTH.INVALID_CREDENTIALS);
  }

  const newRaw = generateRefreshToken();
  const newHash = hashToken(newRaw);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  // Interactive transaction: create new token first to get its ID for replacedBy
  await prisma.$transaction(async (tx) => {
    const newToken = await tx.refreshToken.create({
      data: {
        userId: token.userId,
        tokenHash: newHash,
        family: token.family,
        expiresAt,
      },
    });
    await tx.refreshToken.update({
      where: { id: token.id },
      data: { isRevoked: true, replacedBy: newToken.id },
    });
  });

  const accessToken = issueAccessToken(token.user);
  return { accessToken, refreshToken: newRaw };
}

export async function logout(userId: string, rawRefreshToken?: string): Promise<void> {
  if (rawRefreshToken) {
    const hash = hashToken(rawRefreshToken);
    const token = await prisma.refreshToken.findUnique({ where: { tokenHash: hash } });
    if (token && token.userId === userId) {
      await prisma.refreshToken.updateMany({
        where: { family: token.family },
        data: { isRevoked: true },
      });
    }
  }
}

export async function logoutAll(userId: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { userId },
    data: { isRevoked: true },
  });
}
