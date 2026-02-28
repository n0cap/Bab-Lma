import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../app';

describe('POST /v1/pricing/estimate', () => {
  it('returns price for valid ménage params', async () => {
    const res = await request(app)
      .post('/v1/pricing/estimate')
      .send({ serviceType: 'menage', surface: 80, cleanType: 'simple', teamType: 'solo' });
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('floorPrice');
    expect(res.body.data).toHaveProperty('ceiling');
    expect(res.body.data).toHaveProperty('durationMinutes');
    expect(res.body.data.floorPrice).toBeGreaterThan(0);
    expect(res.body.data.ceiling).toBeGreaterThanOrEqual(res.body.data.floorPrice);
  });

  it('returns price for valid cuisine params', async () => {
    const res = await request(app)
      .post('/v1/pricing/estimate')
      .send({ serviceType: 'cuisine', guests: 6 });
    expect(res.status).toBe(200);
    expect(res.body.data.floorPrice).toBeGreaterThan(0);
  });

  it('returns price for valid childcare params', async () => {
    const res = await request(app)
      .post('/v1/pricing/estimate')
      .send({ serviceType: 'childcare', children: 2, hours: 3 });
    expect(res.status).toBe(200);
    expect(res.body.data.floorPrice).toBeGreaterThan(0);
  });

  it('rejects empty body', async () => {
    const res = await request(app).post('/v1/pricing/estimate').send({});
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects invalid service type', async () => {
    const res = await request(app)
      .post('/v1/pricing/estimate')
      .send({ serviceType: 'plumbing', surface: 50 });
    expect(res.status).toBe(400);
  });

  it('rejects ménage with surface below minimum', async () => {
    const res = await request(app)
      .post('/v1/pricing/estimate')
      .send({ serviceType: 'menage', surface: 5, cleanType: 'simple', teamType: 'solo' });
    expect(res.status).toBe(400);
  });

  it('rejects childcare with zero children', async () => {
    const res = await request(app)
      .post('/v1/pricing/estimate')
      .send({ serviceType: 'childcare', children: 0, hours: 2 });
    expect(res.status).toBe(400);
  });

  it('is accessible without auth token (public endpoint)', async () => {
    const res = await request(app)
      .post('/v1/pricing/estimate')
      .send({ serviceType: 'cuisine', guests: 4 });
    expect(res.status).not.toBe(401);
  });
});
