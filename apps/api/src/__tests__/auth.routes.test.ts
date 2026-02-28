import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../app';

describe('POST /v1/auth/signup — validation', () => {
  it('rejects empty body', async () => {
    const res = await request(app).post('/v1/auth/signup').send({});
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects missing fullName', async () => {
    const res = await request(app)
      .post('/v1/auth/signup')
      .send({ email: 'test@example.com', password: 'pass1234pass' });
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
