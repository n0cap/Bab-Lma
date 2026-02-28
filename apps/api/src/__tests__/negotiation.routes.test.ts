import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../app';
import { signAccessToken } from '../utils/jwt';

const UUID = '550e8400-e29b-41d4-a716-446655440000';
const UUID2 = '660e8400-e29b-41d4-a716-446655440000';

function authHeader() {
  const token = signAccessToken({ userId: 'test-user-id', role: 'client', locale: 'fr' });
  return { Authorization: `Bearer ${token}` };
}

// ── GET /v1/orders/:id/messages ────────────────────────────

describe('GET /v1/orders/:id/messages — auth & validation', () => {
  it('rejects unauthenticated request', async () => {
    const res = await request(app).get(`/v1/orders/${UUID}/messages`);
    expect(res.status).toBe(401);
  });

  it('rejects non-UUID orderId', async () => {
    const res = await request(app)
      .get('/v1/orders/not-a-uuid/messages')
      .set(authHeader());
    expect(res.status).toBe(400);
  });
});

// ── POST /v1/orders/:id/messages ───────────────────────────

describe('POST /v1/orders/:id/messages — auth & validation', () => {
  it('rejects unauthenticated request', async () => {
    const res = await request(app)
      .post(`/v1/orders/${UUID}/messages`)
      .send({ content: 'hello' });
    expect(res.status).toBe(401);
  });

  it('rejects empty body', async () => {
    const res = await request(app)
      .post(`/v1/orders/${UUID}/messages`)
      .set(authHeader())
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects empty content', async () => {
    const res = await request(app)
      .post(`/v1/orders/${UUID}/messages`)
      .set(authHeader())
      .send({ content: '' });
    expect(res.status).toBe(400);
  });

  it('rejects content exceeding 2000 chars', async () => {
    const res = await request(app)
      .post(`/v1/orders/${UUID}/messages`)
      .set(authHeader())
      .send({ content: 'x'.repeat(2001) });
    expect(res.status).toBe(400);
  });

  it('rejects invalid clientMessageId format', async () => {
    const res = await request(app)
      .post(`/v1/orders/${UUID}/messages`)
      .set(authHeader())
      .send({ content: 'hello', clientMessageId: 'not-a-uuid' });
    expect(res.status).toBe(400);
  });
});

// ── GET /v1/orders/:id/offers ──────────────────────────────

describe('GET /v1/orders/:id/offers — auth & validation', () => {
  it('rejects unauthenticated request', async () => {
    const res = await request(app).get(`/v1/orders/${UUID}/offers`);
    expect(res.status).toBe(401);
  });

  it('rejects non-UUID orderId', async () => {
    const res = await request(app)
      .get('/v1/orders/bad-id/offers')
      .set(authHeader());
    expect(res.status).toBe(400);
  });
});

// ── POST /v1/orders/:id/offers ─────────────────────────────

describe('POST /v1/orders/:id/offers — auth & validation', () => {
  it('rejects unauthenticated request', async () => {
    const res = await request(app)
      .post(`/v1/orders/${UUID}/offers`)
      .send({ amount: 150 });
    expect(res.status).toBe(401);
  });

  it('rejects empty body', async () => {
    const res = await request(app)
      .post(`/v1/orders/${UUID}/offers`)
      .set(authHeader())
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects non-integer amount', async () => {
    const res = await request(app)
      .post(`/v1/orders/${UUID}/offers`)
      .set(authHeader())
      .send({ amount: 150.5 });
    expect(res.status).toBe(400);
  });

  it('rejects zero amount', async () => {
    const res = await request(app)
      .post(`/v1/orders/${UUID}/offers`)
      .set(authHeader())
      .send({ amount: 0 });
    expect(res.status).toBe(400);
  });
});

// ── POST /v1/orders/:id/offers/:offerId/accept ────────────

describe('POST /v1/orders/:id/offers/:offerId/accept — auth & validation', () => {
  it('rejects unauthenticated request', async () => {
    const res = await request(app)
      .post(`/v1/orders/${UUID}/offers/${UUID2}/accept`);
    expect(res.status).toBe(401);
  });

  it('rejects non-UUID orderId', async () => {
    const res = await request(app)
      .post(`/v1/orders/bad-id/offers/${UUID2}/accept`)
      .set(authHeader());
    expect(res.status).toBe(400);
  });

  it('rejects non-UUID offerId', async () => {
    const res = await request(app)
      .post(`/v1/orders/${UUID}/offers/bad-id/accept`)
      .set(authHeader());
    expect(res.status).toBe(400);
  });
});

// ── GET /v1/orders/:id/poll ────────────────────────────────

describe('GET /v1/orders/:id/poll — auth & validation', () => {
  it('rejects unauthenticated request', async () => {
    const res = await request(app).get(`/v1/orders/${UUID}/poll`);
    expect(res.status).toBe(401);
  });

  it('rejects non-UUID orderId', async () => {
    const res = await request(app)
      .get('/v1/orders/bad-id/poll')
      .set(authHeader());
    expect(res.status).toBe(400);
  });
});
