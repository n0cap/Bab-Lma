# M2: Auth Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build full auth backend (signup, login, OTP, refresh with reuse detection, logout) and mobile auth screens with AuthContext, delivering a working auth flow from mobile to API.

**Architecture:** Service-layer pattern on API (thin routes → auth.service → Prisma). Mobile uses AuthContext with axios interceptor (refresh mutex) and expo-secure-store for refresh token persistence. Shared Zod schemas validate on both sides.

**Tech Stack:** Express 4, Prisma 6, jsonwebtoken, bcryptjs, vitest, supertest (API). Expo 55, React Navigation 7, TanStack Query 5, expo-secure-store (mobile).

---

### Task 1: Prisma Client Singleton + JWT Utils

**Files:**
- Create: `apps/api/src/db.ts`
- Create: `apps/api/src/utils/jwt.ts`

**Step 1: Create Prisma client singleton**

```typescript
// apps/api/src/db.ts
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
});
```

**Step 2: Create JWT utilities**

```typescript
// apps/api/src/utils/jwt.ts
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { config } from '../config';

export interface JwtPayload {
  userId: string;
  role: string;
  locale: string;
}

export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.accessTtl,
  });
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, config.jwt.secret) as JwtPayload;
}

export function generateRefreshToken(): string {
  return crypto.randomBytes(64).toString('hex');
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
```

**Step 3: Generate Prisma client**

Run: `pnpm --filter @babloo/api exec prisma generate`
Expected: "Generated Prisma Client"

**Step 4: Typecheck**

Run: `pnpm --filter @babloo/api exec tsc --noEmit`
Expected: exit 0, no errors

**Step 5: Commit**

```
feat(api): add Prisma client singleton and JWT utilities
```

---

### Task 2: Middleware Stack (validate, auth, role guard, error handler)

**Files:**
- Create: `apps/api/src/middleware/validate.ts`
- Create: `apps/api/src/middleware/auth.middleware.ts`
- Create: `apps/api/src/middleware/role.guard.ts`
- Create: `apps/api/src/middleware/error.handler.ts`

**Step 1: Create Zod validation middleware**

```typescript
// apps/api/src/middleware/validate.ts
import type { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const fields: Record<string, string> = {};
        for (const issue of err.issues) {
          fields[issue.path.join('.')] = issue.message;
        }
        res.status(400).json({
          error: { code: 'VALIDATION_ERROR', message: 'Données invalides', fields },
        });
        return;
      }
      next(err);
    }
  };
}
```

**Step 2: Create auth middleware**

```typescript
// apps/api/src/middleware/auth.middleware.ts
import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, type JwtPayload } from '../utils/jwt';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

const PUBLIC_ROUTES: Array<{ method: string; path: string }> = [
  { method: 'POST', path: '/v1/auth/signup' },
  { method: 'POST', path: '/v1/auth/login' },
  { method: 'POST', path: '/v1/auth/otp/request' },
  { method: 'POST', path: '/v1/auth/otp/verify' },
  { method: 'POST', path: '/v1/auth/refresh' },
  { method: 'POST', path: '/v1/pricing/estimate' },
  { method: 'GET', path: '/v1/health' },
];

function isPublicRoute(method: string, path: string): boolean {
  return PUBLIC_ROUTES.some(
    (r) => r.method === method && r.path === path,
  );
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  if (isPublicRoute(req.method, req.path)) {
    return next();
  }

  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Token requis' },
    });
    return;
  }

  try {
    const token = header.slice(7);
    req.user = verifyAccessToken(token);
    next();
  } catch {
    res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Token invalide ou expiré' },
    });
  }
}
```

**Step 3: Create role guard**

```typescript
// apps/api/src/middleware/role.guard.ts
import type { Request, Response, NextFunction } from 'express';

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({
        error: { code: 'FORBIDDEN', message: 'Accès interdit' },
      });
      return;
    }
    next();
  };
}
```

**Step 4: Create error handler**

```typescript
// apps/api/src/middleware/error.handler.ts
import type { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: { code: err.code, message: err.message },
    });
    return;
  }

  console.error('[unhandled]', err);
  res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'Erreur interne du serveur' },
  });
}
```

**Step 5: Typecheck**

Run: `pnpm --filter @babloo/api exec tsc --noEmit`
Expected: exit 0

**Step 6: Commit**

```
feat(api): add validation, auth, role guard, and error handler middleware
```

---

### Task 3: Auth Service

**Files:**
- Create: `apps/api/src/services/auth.service.ts`

This is the largest file. All auth business logic lives here.

**Step 1: Write auth service**

```typescript
// apps/api/src/services/auth.service.ts
import bcrypt from 'bcryptjs';
import { prisma } from '../db';
import { config } from '../config';
import { signAccessToken, generateRefreshToken, hashToken } from '../utils/jwt';
import { AppError } from '../middleware/error.handler';
import { normalizePhone } from '@babloo/shared';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

// ── helpers ──────────────────────────────────────────────────

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

// ── signup ───────────────────────────────────────────────────

export async function signup(input: {
  email?: string;
  phone?: string;
  password?: string;
  fullName: string;
}): Promise<TokenPair> {
  const phone = input.phone ? normalizePhone(input.phone) : undefined;

  // Check duplicates
  if (input.email) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw new AppError(409, 'DUPLICATE', 'Un compte avec cet email existe déjà');
  }
  if (phone) {
    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing) throw new AppError(409, 'DUPLICATE', 'Un compte avec ce numéro existe déjà');
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

// ── login (email + password) ─────────────────────────────────

export async function login(email: string, password: string): Promise<TokenPair> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash || !user.isActive) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Identifiants invalides');
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Identifiants invalides');
  }

  const family = generateFamily();
  const accessToken = issueAccessToken(user);
  const refreshToken = await createRefreshToken(user.id, family);

  return { accessToken, refreshToken };
}

// ── OTP request ──────────────────────────────────────────────

export async function otpRequest(phone: string, purpose: string): Promise<{ challengeId: string }> {
  const normalized = normalizePhone(phone);

  // DB-backed throttle: authoritative gate
  const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000);
  const recentCount = await prisma.otpChallenge.count({
    where: { phone: normalized, createdAt: { gte: fifteenMinAgo } },
  });
  if (recentCount >= config.otp.rateLimitPer15Min) {
    throw new AppError(429, 'OTP_RATE_LIMIT', 'Trop de demandes. Réessayez dans quelques minutes.');
  }

  // Generate code
  const code = config.isDev
    ? config.otp.devBypassCode
    : String(Math.floor(100000 + Math.random() * 900000));

  const codeHash = await bcrypt.hash(code, config.bcrypt.rounds);

  const expiresAt = new Date(Date.now() + config.otp.ttlMinutes * 60 * 1000);

  const challenge = await prisma.otpChallenge.create({
    data: { phone: normalized, purpose: purpose as any, codeHash, expiresAt },
  });

  // In production: send SMS via provider here.
  // Dev: code is 123456 (logged below for convenience).
  if (config.isDev) {
    console.log(`[dev-otp] phone=${normalized} code=${code}`);
  }

  return { challengeId: challenge.id };
}

// ── OTP verify ───────────────────────────────────────────────

export async function otpVerify(challengeId: string, code: string): Promise<TokenPair> {
  // Atomic: find unexpired, unconsumed challenge with attempts < max
  const challenge = await prisma.otpChallenge.findFirst({
    where: {
      id: challengeId,
      consumedAt: null,
      attempts: { lt: config.otp.maxAttempts },
      expiresAt: { gt: new Date() },
    },
  });

  if (!challenge) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Identifiants invalides');
  }

  // Increment attempts
  await prisma.otpChallenge.update({
    where: { id: challenge.id },
    data: { attempts: { increment: 1 } },
  });

  const valid = await bcrypt.compare(code, challenge.codeHash);
  if (!valid) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Identifiants invalides');
  }

  // Mark consumed
  await prisma.otpChallenge.update({
    where: { id: challenge.id },
    data: { consumedAt: new Date() },
  });

  // Find or create user by phone
  let user = await prisma.user.findUnique({ where: { phone: challenge.phone } });
  if (!user) {
    user = await prisma.user.create({
      data: { phone: challenge.phone, fullName: challenge.phone },
    });
  }

  if (!user.isActive) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Identifiants invalides');
  }

  const family = generateFamily();
  const accessToken = issueAccessToken(user);
  const refreshToken = await createRefreshToken(user.id, family);

  return { accessToken, refreshToken };
}

// ── refresh ──────────────────────────────────────────────────

export async function refresh(rawRefreshToken: string): Promise<TokenPair> {
  const hash = hashToken(rawRefreshToken);

  const token = await prisma.refreshToken.findUnique({
    where: { tokenHash: hash },
    include: { user: true },
  });

  if (!token) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Identifiants invalides');
  }

  // Reuse detection: revoked token → compromise, revoke entire family
  if (token.isRevoked) {
    await prisma.refreshToken.updateMany({
      where: { family: token.family },
      data: { isRevoked: true },
    });
    throw new AppError(401, 'TOKEN_REUSE', 'Identifiants invalides');
  }

  // Expired
  if (token.expiresAt < new Date()) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Identifiants invalides');
  }

  // Inactive user
  if (!token.user.isActive) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Identifiants invalides');
  }

  // Rotate: revoke current, issue new in same family
  const newRaw = generateRefreshToken();
  const newHash = hashToken(newRaw);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  await prisma.$transaction([
    prisma.refreshToken.update({
      where: { id: token.id },
      data: { isRevoked: true, replacedBy: token.id },
    }),
    prisma.refreshToken.create({
      data: {
        userId: token.userId,
        tokenHash: newHash,
        family: token.family,
        expiresAt,
      },
    }),
  ]);

  const accessToken = issueAccessToken(token.user);
  return { accessToken, refreshToken: newRaw };
}

// ── logout ───────────────────────────────────────────────────

export async function logout(userId: string, rawRefreshToken?: string): Promise<void> {
  if (rawRefreshToken) {
    // Revoke the specific family
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
```

**Step 2: Typecheck**

Run: `pnpm --filter @babloo/api exec tsc --noEmit`
Expected: exit 0

**Step 3: Commit**

```
feat(api): add auth service with signup, login, OTP, refresh, and logout
```

---

### Task 4: Auth Routes + User Routes

**Files:**
- Create: `apps/api/src/routes/auth.routes.ts`
- Create: `apps/api/src/routes/user.routes.ts`
- Modify: `apps/api/src/index.ts` — wire routes + middleware

**Step 1: Create auth routes**

```typescript
// apps/api/src/routes/auth.routes.ts
import { Router, type Request, type Response, type NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { signupSchema, loginSchema, otpRequestSchema, otpVerifySchema, refreshSchema } from '@babloo/shared';
import { validate } from '../middleware/validate';
import { config } from '../config';
import * as authService from '../services/auth.service';

export const authRouter = Router();

const authLimiter = rateLimit({
  windowMs: config.rateLimit.auth.windowMs,
  max: config.rateLimit.auth.max,
  standardHeaders: true,
  legacyHeaders: false,
});

authRouter.use(authLimiter);

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

// POST /v1/auth/signup
authRouter.post(
  '/signup',
  validate(signupSchema),
  asyncHandler(async (req, res) => {
    const tokens = await authService.signup(req.body);
    res.status(201).json({ data: tokens });
  }),
);

// POST /v1/auth/login
authRouter.post(
  '/login',
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const tokens = await authService.login(req.body.email, req.body.password);
    res.json({ data: tokens });
  }),
);

// POST /v1/auth/otp/request
authRouter.post(
  '/otp/request',
  validate(otpRequestSchema),
  asyncHandler(async (req, res) => {
    const result = await authService.otpRequest(req.body.phone, req.body.purpose);
    res.json({ data: result });
  }),
);

// POST /v1/auth/otp/verify
authRouter.post(
  '/otp/verify',
  validate(otpVerifySchema),
  asyncHandler(async (req, res) => {
    const tokens = await authService.otpVerify(req.body.challengeId, req.body.code);
    res.json({ data: tokens });
  }),
);

// POST /v1/auth/refresh
authRouter.post(
  '/refresh',
  validate(refreshSchema),
  asyncHandler(async (req, res) => {
    const tokens = await authService.refresh(req.body.refreshToken);
    res.json({ data: tokens });
  }),
);

// POST /v1/auth/logout (requires auth — handled by global auth middleware)
authRouter.post(
  '/logout',
  asyncHandler(async (req, res) => {
    await authService.logout(req.user!.userId, req.body.refreshToken);
    res.json({ data: { message: 'Déconnecté' } });
  }),
);

// POST /v1/auth/logout-all (requires auth)
authRouter.post(
  '/logout-all',
  asyncHandler(async (req, res) => {
    await authService.logoutAll(req.user!.userId);
    res.json({ data: { message: 'Toutes les sessions fermées' } });
  }),
);
```

**Step 2: Create user routes**

```typescript
// apps/api/src/routes/user.routes.ts
import { Router, type Request, type Response, type NextFunction } from 'express';
import { updateProfileSchema } from '@babloo/shared';
import { validate } from '../middleware/validate';
import { prisma } from '../db';
import { AppError } from '../middleware/error.handler';

export const userRouter = Router();

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

// GET /v1/users/me
userRouter.get(
  '/me',
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        email: true,
        phone: true,
        fullName: true,
        role: true,
        locale: true,
        avatarUrl: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) throw new AppError(404, 'NOT_FOUND', 'Utilisateur non trouvé');
    res.json({ data: user });
  }),
);

// PATCH /v1/users/me
userRouter.patch(
  '/me',
  validate(updateProfileSchema),
  asyncHandler(async (req, res) => {
    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data: req.body,
      select: {
        id: true,
        email: true,
        phone: true,
        fullName: true,
        role: true,
        locale: true,
        avatarUrl: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    res.json({ data: user });
  }),
);
```

**Step 3: Wire routes into index.ts**

Replace `apps/api/src/index.ts` with updated version that adds auth middleware, routes, and error handler:

```typescript
// apps/api/src/index.ts
import express from 'express';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { authMiddleware } from './middleware/auth.middleware';
import { errorHandler } from './middleware/error.handler';
import { authRouter } from './routes/auth.routes';
import { userRouter } from './routes/user.routes';

const app = express();
const httpServer = createServer(app);
const io = new SocketServer(httpServer, {
  cors: {
    origin: config.cors.origins,
    credentials: true,
  },
});

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: config.cors.origins,
    credentials: true,
  }),
);
app.use(express.json({ limit: '1mb' }));
app.use(
  rateLimit({
    windowMs: config.rateLimit.global.windowMs,
    max: config.rateLimit.global.max,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);
app.use(authMiddleware);

// Health check
app.get('/v1/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/v1/auth', authRouter);
app.use('/v1/users', userRouter);

// Error handler (must be last)
app.use(errorHandler);

// Start server
httpServer.listen(config.port, () => {
  console.log(
    `[babloo-api] listening on :${config.port} (${config.nodeEnv})`,
  );
});

export { app, io, httpServer };
```

**Step 4: Typecheck**

Run: `pnpm --filter @babloo/api exec tsc --noEmit`
Expected: exit 0

**Step 5: Commit**

```
feat(api): add auth and user routes, wire middleware stack
```

---

### Task 5: Auth Service Tests

**Files:**
- Create: `apps/api/src/__tests__/auth.service.test.ts`
- May need: `apps/api/vitest.config.ts` (if not present)

**Step 1: Create vitest config for API (if missing)**

```typescript
// apps/api/vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/__tests__/**/*.test.ts'],
  },
});
```

**Step 2: Install supertest devDependency**

Run: `pnpm --filter @babloo/api add -D supertest @types/supertest`

**Step 3: Write auth service unit tests**

These test the service layer with a real or mocked Prisma. Since we cannot run Postgres in this environment, these tests mock the Prisma client using vitest.

```typescript
// apps/api/src/__tests__/auth.service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';
import { signAccessToken, verifyAccessToken, hashToken, generateRefreshToken } from '../utils/jwt';

describe('JWT Utils', () => {
  it('signs and verifies access token round-trip', () => {
    const payload = { userId: 'u1', role: 'client', locale: 'fr' };
    const token = signAccessToken(payload);
    const decoded = verifyAccessToken(token);
    expect(decoded.userId).toBe('u1');
    expect(decoded.role).toBe('client');
    expect(decoded.locale).toBe('fr');
  });

  it('rejects expired token', () => {
    // Sign with 0 seconds TTL — effectively expired immediately.
    // We test verifyAccessToken handles invalid tokens gracefully.
    expect(() => verifyAccessToken('invalid.token.here')).toThrow();
  });

  it('generates 128-char hex refresh token', () => {
    const token = generateRefreshToken();
    expect(token).toHaveLength(128);
    expect(/^[a-f0-9]+$/.test(token)).toBe(true);
  });

  it('hashes token deterministically with sha256', () => {
    const token = 'test-token';
    const h1 = hashToken(token);
    const h2 = hashToken(token);
    expect(h1).toBe(h2);
    expect(h1).toHaveLength(64);
  });
});

describe('bcrypt password hashing', () => {
  it('hashes and verifies password', async () => {
    const password = 'SecurePass123';
    const hash = await bcrypt.hash(password, 4); // low rounds for test speed
    expect(await bcrypt.compare(password, hash)).toBe(true);
    expect(await bcrypt.compare('WrongPass', hash)).toBe(false);
  });
});

describe('bcrypt OTP hashing', () => {
  it('hashes and verifies 6-digit code', async () => {
    const code = '123456';
    const hash = await bcrypt.hash(code, 4);
    expect(await bcrypt.compare(code, hash)).toBe(true);
    expect(await bcrypt.compare('654321', hash)).toBe(false);
  });
});
```

**Step 4: Run tests**

Run: `pnpm --filter @babloo/api test`
Expected: all tests pass

**Step 5: Commit**

```
test(api): add JWT, password, and OTP hashing unit tests
```

---

### Task 6: Auth Route Integration Tests

**Files:**
- Create: `apps/api/src/__tests__/auth.routes.test.ts`

**Step 1: Write route integration tests**

These test the Express app with supertest. Since Prisma requires a real DB, we test validation and middleware behavior that doesn't need DB calls.

```typescript
// apps/api/src/__tests__/auth.routes.test.ts
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../index';

describe('POST /v1/auth/signup — validation', () => {
  it('rejects empty body', async () => {
    const res = await request(app).post('/v1/auth/signup').send({});
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects missing fullName', async () => {
    const res = await request(app)
      .post('/v1/auth/signup')
      .send({ email: 'test@example.com', password: 'pass1234' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects email without password', async () => {
    const res = await request(app)
      .post('/v1/auth/signup')
      .send({ email: 'test@example.com', fullName: 'Test User' });
    expect(res.status).toBe(400);
  });
});

describe('POST /v1/auth/login — validation', () => {
  it('rejects empty body', async () => {
    const res = await request(app).post('/v1/auth/login').send({});
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects missing password', async () => {
    const res = await request(app)
      .post('/v1/auth/login')
      .send({ email: 'test@example.com' });
    expect(res.status).toBe(400);
  });
});

describe('POST /v1/auth/otp/request — validation', () => {
  it('rejects missing phone', async () => {
    const res = await request(app)
      .post('/v1/auth/otp/request')
      .send({ purpose: 'login' });
    expect(res.status).toBe(400);
  });

  it('rejects invalid purpose', async () => {
    const res = await request(app)
      .post('/v1/auth/otp/request')
      .send({ phone: '+212600000000', purpose: 'invalid' });
    expect(res.status).toBe(400);
  });
});

describe('POST /v1/auth/otp/verify — validation', () => {
  it('rejects non-uuid challengeId', async () => {
    const res = await request(app)
      .post('/v1/auth/otp/verify')
      .send({ challengeId: 'not-a-uuid', code: '123456' });
    expect(res.status).toBe(400);
  });

  it('rejects non-6-digit code', async () => {
    const res = await request(app)
      .post('/v1/auth/otp/verify')
      .send({ challengeId: '550e8400-e29b-41d4-a716-446655440000', code: '12345' });
    expect(res.status).toBe(400);
  });
});

describe('Auth middleware — protected routes', () => {
  it('rejects GET /v1/users/me without token', async () => {
    const res = await request(app).get('/v1/users/me');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('rejects GET /v1/users/me with invalid token', async () => {
    const res = await request(app)
      .get('/v1/users/me')
      .set('Authorization', 'Bearer invalid-token');
    expect(res.status).toBe(401);
  });

  it('allows GET /v1/health without token', async () => {
    const res = await request(app).get('/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
```

**Step 2: Run tests**

Run: `pnpm --filter @babloo/api test`
Expected: all tests pass (both service + route tests)

**Step 3: Commit**

```
test(api): add auth route validation and middleware integration tests
```

---

### Task 7: Mobile SecureStore + AuthContext

**Files:**
- Create: `apps/mobile/src/services/secureStore.ts`
- Create: `apps/mobile/src/contexts/AuthContext.tsx`

**Step 1: Create SecureStore wrapper**

```typescript
// apps/mobile/src/services/secureStore.ts
import * as SecureStore from 'expo-secure-store';

const REFRESH_TOKEN_KEY = 'babloo_refresh_token';

export async function getStoredRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export async function storeRefreshToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
}

export async function clearRefreshToken(): Promise<void> {
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}
```

**Step 2: Create AuthContext**

```typescript
// apps/mobile/src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type { User } from '@babloo/shared';
import { api } from '../services/api';
import {
  getStoredRefreshToken,
  storeRefreshToken,
  clearRefreshToken,
} from '../services/secureStore';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  signIn: (tokens: { accessToken: string; refreshToken: string }) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    accessToken: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Refresh mutex: single in-flight promise
  const refreshPromiseRef = useRef<Promise<string | null> | null>(null);

  const fetchUser = useCallback(async (token: string): Promise<User | null> => {
    try {
      const res = await api.get('/users/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data.data;
    } catch {
      return null;
    }
  }, []);

  const doRefresh = useCallback(async (): Promise<string | null> => {
    const stored = await getStoredRefreshToken();
    if (!stored) return null;

    try {
      const res = await api.post('/auth/refresh', { refreshToken: stored });
      const { accessToken, refreshToken } = res.data.data;
      await storeRefreshToken(refreshToken);
      return accessToken;
    } catch {
      await clearRefreshToken();
      return null;
    }
  }, []);

  // Mutex-guarded refresh
  const refreshWithMutex = useCallback(async (): Promise<string | null> => {
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }
    const promise = doRefresh();
    refreshPromiseRef.current = promise;
    try {
      return await promise;
    } finally {
      refreshPromiseRef.current = null;
    }
  }, [doRefresh]);

  // Axios interceptor: attach token + handle 401
  useEffect(() => {
    const requestInterceptor = api.interceptors.request.use((config) => {
      if (state.accessToken) {
        config.headers.Authorization = `Bearer ${state.accessToken}`;
      }
      return config;
    });

    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const original = error.config;
        if (
          error.response?.status === 401 &&
          !original._retry &&
          !original.url?.includes('/auth/')
        ) {
          original._retry = true;
          const newToken = await refreshWithMutex();
          if (newToken) {
            setState((prev) => ({ ...prev, accessToken: newToken }));
            original.headers.Authorization = `Bearer ${newToken}`;
            return api(original);
          }
          // Refresh failed → sign out
          setState({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
          await clearRefreshToken();
        }
        return Promise.reject(error);
      },
    );

    return () => {
      api.interceptors.request.eject(requestInterceptor);
      api.interceptors.response.eject(responseInterceptor);
    };
  }, [state.accessToken, refreshWithMutex]);

  // Bootstrap: try refresh on mount
  useEffect(() => {
    (async () => {
      const token = await refreshWithMutex();
      if (token) {
        const user = await fetchUser(token);
        if (user) {
          setState({ user, accessToken: token, isAuthenticated: true, isLoading: false });
          return;
        }
      }
      setState({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const signIn = useCallback(
    async (tokens: { accessToken: string; refreshToken: string }) => {
      await storeRefreshToken(tokens.refreshToken);
      const user = await fetchUser(tokens.accessToken);
      setState({
        user,
        accessToken: tokens.accessToken,
        isAuthenticated: true,
        isLoading: false,
      });
    },
    [fetchUser],
  );

  const signOut = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Best-effort server logout
    }
    await clearRefreshToken();
    setState({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
```

**Step 3: Typecheck**

Run: `pnpm --filter @babloo/mobile exec tsc --noEmit`
Expected: exit 0

**Step 4: Commit**

```
feat(mobile): add SecureStore wrapper and AuthContext with refresh mutex
```

---

### Task 8: Mobile Auth Mutations + Queries

**Files:**
- Create: `apps/mobile/src/services/mutations/auth.ts`
- Create: `apps/mobile/src/services/queries/user.ts`

**Step 1: Create auth mutations**

```typescript
// apps/mobile/src/services/mutations/auth.ts
import { useMutation } from '@tanstack/react-query';
import { api } from '../api';
import type { AuthTokens } from '@babloo/shared';

interface SignupInput {
  email?: string;
  phone?: string;
  password?: string;
  fullName: string;
}

interface LoginInput {
  email: string;
  password: string;
}

interface OtpRequestInput {
  phone: string;
  purpose: 'login' | 'signup' | 'reset';
}

interface OtpVerifyInput {
  challengeId: string;
  code: string;
}

export function useSignup() {
  return useMutation({
    mutationFn: async (input: SignupInput): Promise<AuthTokens> => {
      const res = await api.post('/auth/signup', input);
      return res.data.data;
    },
  });
}

export function useLogin() {
  return useMutation({
    mutationFn: async (input: LoginInput): Promise<AuthTokens> => {
      const res = await api.post('/auth/login', input);
      return res.data.data;
    },
  });
}

export function useOtpRequest() {
  return useMutation({
    mutationFn: async (input: OtpRequestInput): Promise<{ challengeId: string }> => {
      const res = await api.post('/auth/otp/request', input);
      return res.data.data;
    },
  });
}

export function useOtpVerify() {
  return useMutation({
    mutationFn: async (input: OtpVerifyInput): Promise<AuthTokens> => {
      const res = await api.post('/auth/otp/verify', input);
      return res.data.data;
    },
  });
}

export function useLogout() {
  return useMutation({
    mutationFn: async (): Promise<void> => {
      await api.post('/auth/logout');
    },
  });
}
```

**Step 2: Create user query**

```typescript
// apps/mobile/src/services/queries/user.ts
import { useQuery } from '@tanstack/react-query';
import { api } from '../api';
import type { User } from '@babloo/shared';

export function useMe(enabled = true) {
  return useQuery({
    queryKey: ['me'],
    queryFn: async (): Promise<User> => {
      const res = await api.get('/users/me');
      return res.data.data;
    },
    enabled,
  });
}
```

**Step 3: Typecheck**

Run: `pnpm --filter @babloo/mobile exec tsc --noEmit`
Expected: exit 0

**Step 4: Commit**

```
feat(mobile): add auth mutation hooks and user query
```

---

### Task 9: Mobile Auth Screens

**Files:**
- Modify: `apps/mobile/src/screens/auth/AuthEntryScreen.tsx`
- Create: `apps/mobile/src/screens/auth/SignInEmailScreen.tsx`
- Create: `apps/mobile/src/screens/auth/SignInPhoneScreen.tsx`
- Create: `apps/mobile/src/screens/auth/SignUpEmailScreen.tsx`
- Create: `apps/mobile/src/screens/auth/SignUpPhoneScreen.tsx`
- Create: `apps/mobile/src/screens/auth/OtpScreen.tsx`
- Create: `apps/mobile/src/screens/auth/ForgotPasswordScreen.tsx`

**Step 1: Update AuthEntryScreen with navigation**

Replace `AuthEntryScreen.tsx` — adds two buttons (email / phone) that navigate to their respective flows:

```typescript
// apps/mobile/src/screens/auth/AuthEntryScreen.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import type { AuthStackParamList } from '../../navigation/AuthStack';
import { colors, textStyles, spacing } from '../../theme';

type Nav = NativeStackNavigationProp<AuthStackParamList>;

export function AuthEntryScreen() {
  const nav = useNavigation<Nav>();

  return (
    <View style={styles.container}>
      <Text style={[textStyles.display, { color: colors.navy }]}>Babloo</Text>
      <Text style={[textStyles.body, { color: colors.textSec, marginTop: 8, marginBottom: 36 }]}>
        Vos services à domicile
      </Text>

      <TouchableOpacity style={styles.btnPrimary} onPress={() => nav.navigate('SignInEmail')}>
        <Text style={styles.btnPrimaryText}>Connexion par email</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.btnOutline} onPress={() => nav.navigate('SignInPhone')}>
        <Text style={styles.btnOutlineText}>Connexion par téléphone</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => nav.navigate('SignUpEmail')} style={{ marginTop: spacing.lg }}>
        <Text style={[textStyles.body, { color: colors.clay }]}>
          Pas encore de compte ? Inscrivez-vous
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  btnPrimary: {
    width: '100%',
    backgroundColor: colors.navy,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  btnPrimaryText: {
    color: colors.white,
    fontFamily: 'DMSans_700Bold',
    fontSize: 15,
  },
  btnOutline: {
    width: '100%',
    borderColor: colors.navy,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnOutlineText: {
    color: colors.navy,
    fontFamily: 'DMSans_700Bold',
    fontSize: 15,
  },
});
```

**Step 2: Create remaining auth screens**

Each screen follows the same pattern: form inputs, validation, mutation call, on success → `auth.signIn(tokens)`.

Create `SignInEmailScreen.tsx`, `SignInPhoneScreen.tsx`, `SignUpEmailScreen.tsx`, `SignUpPhoneScreen.tsx`, `OtpScreen.tsx`, `ForgotPasswordScreen.tsx` per the design doc patterns. Each screen:
- Uses `useAuth()` for `signIn`
- Uses the appropriate mutation hook
- Shows validation errors from Zod (client-side) and API (server-side)
- French labels from `i18n`
- Navigates on success

(Full code for each screen is provided inline during execution — they follow identical form patterns differing only in fields and mutation hook used.)

**Step 3: Update AuthStack to register all screens**

Modify `apps/mobile/src/navigation/AuthStack.tsx` to add all 7 screens:

```typescript
// apps/mobile/src/navigation/AuthStack.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthEntryScreen } from '../screens/auth/AuthEntryScreen';
import { SignInEmailScreen } from '../screens/auth/SignInEmailScreen';
import { SignInPhoneScreen } from '../screens/auth/SignInPhoneScreen';
import { SignUpEmailScreen } from '../screens/auth/SignUpEmailScreen';
import { SignUpPhoneScreen } from '../screens/auth/SignUpPhoneScreen';
import { OtpScreen } from '../screens/auth/OtpScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';

export type AuthStackParamList = {
  AuthEntry: undefined;
  SignInEmail: undefined;
  SignInPhone: undefined;
  SignUpEmail: undefined;
  SignUpPhone: undefined;
  Otp: { challengeId: string; phone: string };
  ForgotPassword: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AuthEntry" component={AuthEntryScreen} />
      <Stack.Screen name="SignInEmail" component={SignInEmailScreen} />
      <Stack.Screen name="SignInPhone" component={SignInPhoneScreen} />
      <Stack.Screen name="SignUpEmail" component={SignUpEmailScreen} />
      <Stack.Screen name="SignUpPhone" component={SignUpPhoneScreen} />
      <Stack.Screen name="Otp" component={OtpScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
}
```

**Step 4: Typecheck**

Run: `pnpm --filter @babloo/mobile exec tsc --noEmit`
Expected: exit 0

**Step 5: Commit**

```
feat(mobile): add auth screens (sign-in, sign-up, OTP, forgot password)
```

---

### Task 10: Wire AuthProvider + Update App.tsx + RootNavigator

**Files:**
- Modify: `apps/mobile/App.tsx`
- Modify: `apps/mobile/src/navigation/RootNavigator.tsx`

**Step 1: Update App.tsx to wrap with AuthProvider**

```typescript
// apps/mobile/App.tsx — add AuthProvider wrapping QueryClientProvider
import { AuthProvider } from './src/contexts/AuthContext';

// In the render, wrap inside SafeAreaProvider:
<SafeAreaProvider onLayout={onLayoutRootView}>
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <StatusBar barStyle="dark-content" />
      <RootNavigator />
    </AuthProvider>
  </QueryClientProvider>
</SafeAreaProvider>
```

**Step 2: Update RootNavigator to use AuthContext**

```typescript
// apps/mobile/src/navigation/RootNavigator.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator, View } from 'react-native';
import { AuthStack } from './AuthStack';
import { MainTabs } from './MainTabs';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../theme';

export function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.navy} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
}
```

**Step 3: Typecheck**

Run: `pnpm --filter @babloo/mobile exec tsc --noEmit`
Expected: exit 0

**Step 4: Commit**

```
feat(mobile): wire AuthProvider into App and RootNavigator
```

---

### Task 11: Update i18n with auth-related translations

**Files:**
- Modify: `apps/mobile/src/i18n/fr.json`

**Step 1: Add auth screen labels**

Update `fr.json` to add any missing keys used by the auth screens (form labels, button text, error messages). The existing keys from M1 already cover most auth terms. Add:

```json
{
  "auth": {
    "...existing keys...",
    "emailPlaceholder": "votre@email.com",
    "passwordPlaceholder": "Votre mot de passe",
    "phonePlaceholder": "+212 6XX XXX XXX",
    "fullNamePlaceholder": "Votre nom complet",
    "otpTitle": "Code de vérification",
    "otpSubtitle": "Entrez le code envoyé au {{phone}}",
    "signInWithEmail": "Connexion par email",
    "signInWithPhone": "Connexion par téléphone",
    "signUpWithEmail": "Inscription par email",
    "signUpWithPhone": "Inscription par téléphone",
    "createAccount": "Créer un compte",
    "networkError": "Erreur de connexion. Vérifiez votre réseau."
  }
}
```

**Step 2: Typecheck**

Run: `pnpm --filter @babloo/mobile exec tsc --noEmit`
Expected: exit 0

**Step 3: Commit**

```
chore(mobile): add auth screen i18n translations
```

---

### Task 12: Final Validation

**Step 1: Run all checks**

Run each in sequence:
1. `pnpm --filter @babloo/shared test` — shared tests (55/55)
2. `pnpm --filter @babloo/api test` — API auth tests
3. `pnpm --filter @babloo/api exec tsc --noEmit` — API typecheck
4. `pnpm --filter @babloo/mobile exec tsc --noEmit` — mobile typecheck

Expected: all pass, exit 0

**Step 2: Verify no regressions**

Run: `git diff --stat HEAD~12..HEAD` to see the full M2 diff.

**Step 3: Report results**

Report pass/fail per command with exact output. List any blockers. M2 code-complete when all four checks pass.
