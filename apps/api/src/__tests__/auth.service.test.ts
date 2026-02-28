import { describe, it, expect } from 'vitest';
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

  it('rejects invalid token', () => {
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
    const hash = await bcrypt.hash(password, 4);
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
