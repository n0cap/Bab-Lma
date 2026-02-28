import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../app';
import { signAccessToken } from '../utils/jwt';

// Helper: generate a valid JWT for testing middleware/validation
function authHeader() {
  const token = signAccessToken({ userId: 'test-user-id', role: 'client', locale: 'fr' });
  return { Authorization: `Bearer ${token}` };
}

describe('POST /v1/orders — validation', () => {
  it('rejects unauthenticated request', async () => {
    const res = await request(app).post('/v1/orders').send({});
    expect(res.status).toBe(401);
  });

  it('rejects empty body', async () => {
    const res = await request(app)
      .post('/v1/orders')
      .set(authHeader())
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects missing detail', async () => {
    const res = await request(app)
      .post('/v1/orders')
      .set(authHeader())
      .send({ serviceType: 'menage', location: 'Casablanca' });
    expect(res.status).toBe(400);
  });

  it('rejects invalid service type', async () => {
    const res = await request(app)
      .post('/v1/orders')
      .set(authHeader())
      .send({
        serviceType: 'plumbing',
        location: 'Rabat',
        detail: { serviceType: 'plumbing', surface: 50 },
      });
    expect(res.status).toBe(400);
  });
});

describe('GET /v1/orders — auth', () => {
  it('rejects unauthenticated request', async () => {
    const res = await request(app).get('/v1/orders');
    expect(res.status).toBe(401);
  });
});

describe('GET /v1/orders/:id — validation', () => {
  it('rejects unauthenticated request', async () => {
    const res = await request(app).get('/v1/orders/550e8400-e29b-41d4-a716-446655440000');
    expect(res.status).toBe(401);
  });

  it('rejects non-UUID id', async () => {
    const res = await request(app)
      .get('/v1/orders/not-a-uuid')
      .set(authHeader());
    expect(res.status).toBe(400);
  });
});

describe('POST /v1/orders/:id/cancel — validation', () => {
  it('rejects unauthenticated request', async () => {
    const res = await request(app)
      .post('/v1/orders/550e8400-e29b-41d4-a716-446655440000/cancel')
      .send({});
    expect(res.status).toBe(401);
  });

  it('rejects non-UUID id', async () => {
    const res = await request(app)
      .post('/v1/orders/not-a-uuid/cancel')
      .set(authHeader())
      .send({});
    expect(res.status).toBe(400);
  });
});
