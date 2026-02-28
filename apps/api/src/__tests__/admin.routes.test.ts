import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../app';
import { signAccessToken } from '../utils/jwt';

const UUID = '550e8400-e29b-41d4-a716-446655440000';

function adminAuth() {
  return { Authorization: `Bearer ${signAccessToken({ userId: 'test-admin', role: 'admin', locale: 'fr' })}` };
}

function clientAuth() {
  return { Authorization: `Bearer ${signAccessToken({ userId: 'test-client', role: 'client', locale: 'fr' })}` };
}

// ── Role guard ──────────────────────────────────────────

describe('Admin routes — role guard', () => {
  it('rejects unauthenticated request', async () => {
    const res = await request(app)
      .patch(`/v1/admin/orders/${UUID}/status`)
      .send({ toStatus: 'completed' });
    expect(res.status).toBe(401);
  });

  it('rejects non-admin user (client)', async () => {
    const res = await request(app)
      .patch(`/v1/admin/orders/${UUID}/status`)
      .set(clientAuth())
      .send({ toStatus: 'completed' });
    expect(res.status).toBe(403);
  });
});

// ── PATCH /v1/admin/orders/:id/status ───────────────────

describe('PATCH /v1/admin/orders/:id/status — validation', () => {
  it('rejects missing toStatus', async () => {
    const res = await request(app)
      .patch(`/v1/admin/orders/${UUID}/status`)
      .set(adminAuth())
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects invalid status value', async () => {
    const res = await request(app)
      .patch(`/v1/admin/orders/${UUID}/status`)
      .set(adminAuth())
      .send({ toStatus: 'nonexistent' });
    expect(res.status).toBe(400);
  });

  it('accepts valid toStatus (passes validation, hits service)', async () => {
    const res = await request(app)
      .patch(`/v1/admin/orders/${UUID}/status`)
      .set(adminAuth())
      .send({ toStatus: 'completed' });
    // Should not be 400 (passes validation) or 403 (admin passes guard)
    expect(res.status).not.toBe(400);
    expect(res.status).not.toBe(403);
  });
});

// ── PATCH /v1/admin/orders/:id/price ────────────────────

describe('PATCH /v1/admin/orders/:id/price — validation', () => {
  it('rejects non-admin', async () => {
    const res = await request(app)
      .patch(`/v1/admin/orders/${UUID}/price`)
      .set(clientAuth())
      .send({ finalPrice: 200 });
    expect(res.status).toBe(403);
  });

  it('rejects missing finalPrice', async () => {
    const res = await request(app)
      .patch(`/v1/admin/orders/${UUID}/price`)
      .set(adminAuth())
      .send({});
    expect(res.status).toBe(400);
  });

  it('rejects negative finalPrice', async () => {
    const res = await request(app)
      .patch(`/v1/admin/orders/${UUID}/price`)
      .set(adminAuth())
      .send({ finalPrice: -10 });
    expect(res.status).toBe(400);
  });

  it('accepts valid finalPrice (passes validation)', async () => {
    const res = await request(app)
      .patch(`/v1/admin/orders/${UUID}/price`)
      .set(adminAuth())
      .send({ finalPrice: 200 });
    expect(res.status).not.toBe(400);
    expect(res.status).not.toBe(403);
  });
});

// ── PATCH /v1/admin/users/:id ───────────────────────────

describe('PATCH /v1/admin/users/:id — validation', () => {
  it('rejects non-admin', async () => {
    const res = await request(app)
      .patch(`/v1/admin/users/${UUID}`)
      .set(clientAuth())
      .send({ isActive: false });
    expect(res.status).toBe(403);
  });

  it('rejects missing isActive', async () => {
    const res = await request(app)
      .patch(`/v1/admin/users/${UUID}`)
      .set(adminAuth())
      .send({});
    expect(res.status).toBe(400);
  });

  it('rejects non-boolean isActive', async () => {
    const res = await request(app)
      .patch(`/v1/admin/users/${UUID}`)
      .set(adminAuth())
      .send({ isActive: 'yes' });
    expect(res.status).toBe(400);
  });

  it('accepts valid isActive toggle', async () => {
    const res = await request(app)
      .patch(`/v1/admin/users/${UUID}`)
      .set(adminAuth())
      .send({ isActive: false });
    expect(res.status).not.toBe(400);
    expect(res.status).not.toBe(403);
  });
});

// ── GET /v1/admin/audit-log ─────────────────────────────

describe('GET /v1/admin/audit-log', () => {
  it('rejects non-admin', async () => {
    const res = await request(app)
      .get('/v1/admin/audit-log')
      .set(clientAuth());
    expect(res.status).toBe(403);
  });

  it('accepts admin request (passes guard)', async () => {
    const res = await request(app)
      .get('/v1/admin/audit-log')
      .set(adminAuth());
    expect(res.status).not.toBe(403);
  });
});
