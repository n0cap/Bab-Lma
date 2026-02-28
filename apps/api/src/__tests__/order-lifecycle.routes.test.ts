import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../app';
import { signAccessToken } from '../utils/jwt';

const UUID = '550e8400-e29b-41d4-a716-446655440000';

function clientAuth() {
  return { Authorization: `Bearer ${signAccessToken({ userId: 'test-client', role: 'client', locale: 'fr' })}` };
}

function proAuth() {
  return { Authorization: `Bearer ${signAccessToken({ userId: 'test-pro', role: 'pro', locale: 'fr' })}` };
}

// ── POST /v1/orders/:id/rating ──────────────────────────

describe('POST /v1/orders/:id/rating — validation', () => {
  it('rejects unauthenticated request', async () => {
    const res = await request(app)
      .post(`/v1/orders/${UUID}/rating`)
      .send({ stars: 5 });
    expect(res.status).toBe(401);
  });

  it('rejects missing stars', async () => {
    const res = await request(app)
      .post(`/v1/orders/${UUID}/rating`)
      .set(clientAuth())
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects stars out of range (0)', async () => {
    const res = await request(app)
      .post(`/v1/orders/${UUID}/rating`)
      .set(clientAuth())
      .send({ stars: 0 });
    expect(res.status).toBe(400);
  });

  it('rejects stars out of range (6)', async () => {
    const res = await request(app)
      .post(`/v1/orders/${UUID}/rating`)
      .set(clientAuth())
      .send({ stars: 6 });
    expect(res.status).toBe(400);
  });

  it('rejects non-integer stars', async () => {
    const res = await request(app)
      .post(`/v1/orders/${UUID}/rating`)
      .set(clientAuth())
      .send({ stars: 3.5 });
    expect(res.status).toBe(400);
  });

  it('rejects comment over 1000 chars', async () => {
    const res = await request(app)
      .post(`/v1/orders/${UUID}/rating`)
      .set(clientAuth())
      .send({ stars: 5, comment: 'a'.repeat(1001) });
    expect(res.status).toBe(400);
  });

  it('rejects non-UUID order id', async () => {
    const res = await request(app)
      .post('/v1/orders/not-uuid/rating')
      .set(clientAuth())
      .send({ stars: 5 });
    expect(res.status).toBe(400);
  });
});

// ── PATCH /v1/orders/:id/status ─────────────────────────

describe('PATCH /v1/orders/:id/status — validation', () => {
  it('rejects unauthenticated request', async () => {
    const res = await request(app)
      .patch(`/v1/orders/${UUID}/status`)
      .send({ toStatus: 'in_progress' });
    expect(res.status).toBe(401);
  });

  it('rejects missing toStatus', async () => {
    const res = await request(app)
      .patch(`/v1/orders/${UUID}/status`)
      .set(proAuth())
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects invalid toStatus value', async () => {
    const res = await request(app)
      .patch(`/v1/orders/${UUID}/status`)
      .set(proAuth())
      .send({ toStatus: 'invalid_status' });
    expect(res.status).toBe(400);
  });

  it('accepts valid toStatus values', async () => {
    // This will fail at the service layer (no real DB), but should pass validation (not 400)
    const res = await request(app)
      .patch(`/v1/orders/${UUID}/status`)
      .set(proAuth())
      .send({ toStatus: 'in_progress' });
    // Should not be 400 (validation error) — it should hit the service layer
    expect(res.status).not.toBe(400);
  });

  it('rejects non-UUID order id', async () => {
    const res = await request(app)
      .patch('/v1/orders/not-uuid/status')
      .set(proAuth())
      .send({ toStatus: 'completed' });
    expect(res.status).toBe(400);
  });
});
