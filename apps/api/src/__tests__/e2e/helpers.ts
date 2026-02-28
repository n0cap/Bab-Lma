import request from 'supertest';
import { app } from '../../app';
import { prisma } from '../../db';

/**
 * Truncate all tables in dependency-safe order.
 * Call in beforeEach or beforeAll to reset state between tests.
 */
export async function truncateAll() {
  const tables = [
    'audit_logs',
    'ratings',
    'negotiation_offers',
    'messages',
    'status_events',
    'order_assignments',
    'order_details',
    'orders',
    'refresh_tokens',
    'otp_challenges',
    'idempotency_keys',
    'professionals',
    'users',
  ];

  for (const table of tables) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE`);
  }
}

/**
 * Sign up a new user via the API.
 * Returns access + refresh tokens.
 */
export async function signupUser(
  email: string,
  password: string,
  fullName: string,
): Promise<{ accessToken: string; refreshToken: string }> {
  const res = await request(app)
    .post('/v1/auth/signup')
    .send({ email, password, fullName });

  if (res.status !== 201) {
    throw new Error(`Signup failed: ${res.status} ${JSON.stringify(res.body)}`);
  }

  return {
    accessToken: res.body.data.accessToken,
    refreshToken: res.body.data.refreshToken,
  };
}

/**
 * Create a user with `pro` role and a `Professional` record.
 */
export async function makeProUser(
  email: string,
  password: string,
  fullName: string,
): Promise<{ accessToken: string; refreshToken: string; userId: string; professionalId: string }> {
  const tokens = await signupUser(email, password, fullName);

  // Decode token to get userId (or find by email)
  const user = await prisma.user.findUniqueOrThrow({ where: { email } });

  // Promote to pro
  await prisma.user.update({
    where: { id: user.id },
    data: { role: 'pro' },
  });

  // Create Professional record
  const professional = await prisma.professional.create({
    data: {
      userId: user.id,
      skills: ['menage', 'cuisine', 'childcare'],
      zones: ['casablanca'],
    },
  });

  // Re-login to get a token with the updated role
  const loginRes = await request(app)
    .post('/v1/auth/login')
    .send({ email, password });

  return {
    accessToken: loginRes.body.data.accessToken,
    refreshToken: loginRes.body.data.refreshToken,
    userId: user.id,
    professionalId: professional.id,
  };
}

/**
 * Build Authorization header.
 */
export function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}
