import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../../app';
import { prisma } from '../../db';
import { truncateAll, signupUser, makeProUser, authHeader } from './helpers';

describe('Critical path: signup → order → negotiate → complete → rate', () => {
  let clientToken: string;
  let proToken: string;
  let proUserId: string;
  let proProfessionalId: string;
  let orderId: string;
  let offerId: string;

  beforeAll(async () => {
    await truncateAll();
  });

  // ── Auth ──────────────────────────────────────────────────
  it('client signs up', async () => {
    const tokens = await signupUser('client@test.ma', 'password1234', 'Fatima Test');
    clientToken = tokens.accessToken;
    expect(clientToken).toBeTruthy();
  });

  it('pro signs up and is assigned pro role', async () => {
    const pro = await makeProUser('pro@test.ma', 'password1234', 'Ahmed Pro');
    proToken = pro.accessToken;
    proUserId = pro.userId;
    proProfessionalId = pro.professionalId;
    expect(proToken).toBeTruthy();

    const user = await prisma.user.findUnique({ where: { email: 'pro@test.ma' } });
    expect(user?.role).toBe('pro');
  });

  // ── Order creation ────────────────────────────────────────
  it('client creates a ménage order', async () => {
    const res = await request(app)
      .post('/v1/orders')
      .set(authHeader(clientToken))
      .send({
        serviceType: 'menage',
        location: 'Casablanca, Maarif',
        detail: {
          serviceType: 'menage',
          surface: 80,
          cleanType: 'simple',
          teamType: 'solo',
        },
      });

    expect(res.status).toBe(201);
    orderId = res.body.data.id;
    expect(orderId).toBeTruthy();
    expect(res.body.data.serviceType).toBe('menage');
  });

  it('order is submitted with correct floor price', async () => {
    const res = await request(app)
      .get(`/v1/orders/${orderId}`)
      .set(authHeader(clientToken));

    expect(res.status).toBe(200);
    expect(res.body.data.floorPrice).toBeGreaterThan(0);
    expect(res.body.data.status).toBe('submitted');
  });

  // ── Transition to negotiating + assign pro ────────────────
  it('admin transitions order to searching then negotiating', async () => {
    // Manually transition: submitted → searching → negotiating
    // + assign pro to order
    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'searching' },
    });

    await prisma.statusEvent.create({
      data: {
        orderId,
        fromStatus: 'submitted',
        toStatus: 'searching',
        actorUserId: proUserId,
        actorRole: 'system',
      },
    });

    // Assign pro
    await prisma.orderAssignment.create({
      data: {
        orderId,
        professionalId: proProfessionalId,
        status: 'confirmed',
      },
    });

    // Transition to negotiating
    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'negotiating' },
    });

    await prisma.statusEvent.create({
      data: {
        orderId,
        fromStatus: 'searching',
        toStatus: 'negotiating',
        actorUserId: proUserId,
        actorRole: 'system',
      },
    });

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    expect(order?.status).toBe('negotiating');
  });

  // ── Negotiation ───────────────────────────────────────────
  it('pro sends a message', async () => {
    const res = await request(app)
      .post(`/v1/orders/${orderId}/messages`)
      .set(authHeader(proToken))
      .send({ content: 'Bonjour, je suis disponible !' });

    expect(res.status).toBe(201);
    expect(res.body.data.content).toBe('Bonjour, je suis disponible !');
    expect(res.body.data.senderRole).toBe('pro');
  });

  it('pro creates an offer at floor price', async () => {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    const floorPrice = order!.floorPrice;

    // Ensure amount is multiple of 5
    const amount = Math.ceil(floorPrice / 5) * 5;

    const res = await request(app)
      .post(`/v1/orders/${orderId}/offers`)
      .set(authHeader(proToken))
      .send({ amount });

    expect(res.status).toBe(201);
    offerId = res.body.data.id;
    expect(res.body.data.status).toBe('pending');
    expect(res.body.data.amount).toBe(amount);
  });

  it('client accepts the offer', async () => {
    const res = await request(app)
      .post(`/v1/orders/${orderId}/offers/${offerId}/accept`)
      .set(authHeader(clientToken));

    expect(res.status).toBe(200);
    expect(res.body.data.offer.status).toBe('accepted');
  });

  it('order finalPrice is locked', async () => {
    const res = await request(app)
      .get(`/v1/orders/${orderId}`)
      .set(authHeader(clientToken));

    expect(res.status).toBe(200);
    expect(res.body.data.finalPrice).toBeTruthy();
    expect(res.body.data.status).toBe('accepted');
  });

  // ── Status progression ────────────────────────────────────
  it('pro advances status: accepted → en_route', async () => {
    const res = await request(app)
      .patch(`/v1/orders/${orderId}/status`)
      .set(authHeader(proToken))
      .send({ toStatus: 'en_route' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('en_route');
  });

  it('pro advances status: en_route → in_progress', async () => {
    const res = await request(app)
      .patch(`/v1/orders/${orderId}/status`)
      .set(authHeader(proToken))
      .send({ toStatus: 'in_progress' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('in_progress');
  });

  it('pro advances status: in_progress → completed', async () => {
    const res = await request(app)
      .patch(`/v1/orders/${orderId}/status`)
      .set(authHeader(proToken))
      .send({ toStatus: 'completed' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('completed');
  });

  // ── Rating ────────────────────────────────────────────────
  it('client submits a rating', async () => {
    const res = await request(app)
      .post(`/v1/orders/${orderId}/rating`)
      .set(authHeader(clientToken))
      .send({ stars: 5, comment: 'Excellent service !' });

    expect(res.status).toBe(201);
    expect(res.body.data.stars).toBe(5);
  });

  it('pro weighted average is updated', async () => {
    const pro = await prisma.professional.findUnique({
      where: { id: proProfessionalId },
    });

    expect(pro?.totalSessions).toBe(1);
    expect(pro?.rating).toBeGreaterThan(0);
  });

  it('duplicate rating returns 409', async () => {
    const res = await request(app)
      .post(`/v1/orders/${orderId}/rating`)
      .set(authHeader(clientToken))
      .send({ stars: 4 });

    expect(res.status).toBe(409);
  });
});
