import { prisma } from '../db';
import { isValidTransition } from '@babloo/shared';
import { AppError } from '../middleware/error.handler';

// ── Constants ──────────────────────────────────────────────
const CEILING_MULTIPLIER = 2.5;
const OFFER_STEP = 5;

// ── Helpers ────────────────────────────────────────────────

/**
 * Verify that `userId` is a participant in the order (client or assigned pro).
 * Returns { order, role } where role is 'client' | 'pro'.
 */
export async function checkParticipant(userId: string, orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { assignments: { include: { professional: true } } },
  });

  if (!order) {
    throw new AppError(404, 'NOT_FOUND', 'Commande non trouvée');
  }

  // Check if user is the client
  if (order.clientId === userId) {
    return { order, participantRole: 'client' as const };
  }

  // Check if user is an assigned professional
  const assignment = order.assignments.find(
    (a) => a.professional.userId === userId,
  );
  if (assignment) {
    return { order, participantRole: 'pro' as const };
  }

  throw new AppError(403, 'FORBIDDEN', 'Accès non autorisé à cette commande');
}

// ── Messages ───────────────────────────────────────────────

export async function listMessages(
  orderId: string,
  sinceSeq: number,
  limit: number,
) {
  const messages = await prisma.message.findMany({
    where: { orderId, seq: { gt: sinceSeq } },
    orderBy: { seq: 'asc' },
    take: limit,
  });

  return messages;
}

export async function sendMessage(
  userId: string,
  orderId: string,
  content: string,
  senderRole: 'client' | 'pro',
  clientMessageId?: string,
) {
  // Idempotency: if clientMessageId already exists, return existing
  if (clientMessageId) {
    const existing = await prisma.message.findUnique({
      where: { clientMessageId },
    });
    if (existing) {
      return existing;
    }
  }

  const message = await prisma.message.create({
    data: {
      orderId,
      senderId: userId,
      senderRole,
      content,
      clientMessageId: clientMessageId ?? null,
    },
  });

  return message;
}

// ── Offers ─────────────────────────────────────────────────

export async function listOffers(orderId: string) {
  const offers = await prisma.negotiationOffer.findMany({
    where: { orderId },
    orderBy: { seq: 'asc' },
  });

  return offers;
}

export async function createOffer(
  userId: string,
  orderId: string,
  amount: number,
  order: { floorPrice: number; status: string },
) {
  // Validate order is in negotiating state
  if (order.status !== 'negotiating') {
    throw new AppError(409, 'INVALID_STATE', 'La commande n\'est pas en négociation');
  }

  const floor = order.floorPrice;
  const ceiling = Math.round(floor * CEILING_MULTIPLIER);

  // Validate amount bounds
  if (amount < floor || amount > ceiling) {
    throw new AppError(400, 'VALIDATION_ERROR', `Montant hors limites (${floor}–${ceiling} MAD)`);
  }

  // Validate step
  if (amount % OFFER_STEP !== 0) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Montant doit être un multiple de 5');
  }

  // Auto-reject previous pending offers by this user
  await prisma.negotiationOffer.updateMany({
    where: { orderId, offeredBy: userId, status: 'pending' },
    data: { status: 'rejected' },
  });

  // Create new offer
  const offer = await prisma.negotiationOffer.create({
    data: {
      orderId,
      offeredBy: userId,
      amount,
      status: 'pending',
    },
  });

  return offer;
}

export async function acceptOffer(
  userId: string,
  orderId: string,
  offerId: string,
  order: { floorPrice: number; status: string },
  participantRole: 'client' | 'pro',
) {
  // Validate order is in negotiating state
  if (order.status !== 'negotiating') {
    throw new AppError(409, 'INVALID_STATE', 'La commande n\'est pas en négociation');
  }

  // Pre-flight check (non-atomic, for fast-fail with clear errors)
  const offer = await prisma.negotiationOffer.findUnique({
    where: { id: offerId },
  });

  if (!offer || offer.orderId !== orderId) {
    throw new AppError(404, 'NOT_FOUND', 'Offre non trouvée');
  }

  if (offer.status !== 'pending') {
    throw new AppError(409, 'INVALID_STATE', 'Cette offre n\'est plus en attente');
  }

  // Can't accept own offer
  if (offer.offeredBy === userId) {
    throw new AppError(403, 'FORBIDDEN', 'Vous ne pouvez pas accepter votre propre offre');
  }

  // Atomic price lock transaction with guarded update
  const result = await prisma.$transaction(async (tx) => {
    // 1. Guarded accept: only succeeds if offer is still pending for this order
    const { count } = await tx.negotiationOffer.updateMany({
      where: { id: offerId, orderId, status: 'pending' },
      data: { status: 'accepted', acceptedAt: new Date() },
    });

    if (count === 0) {
      throw new AppError(409, 'INVALID_STATE', 'Cette offre n\'est plus en attente');
    }

    // Re-fetch the accepted offer for return value
    const accepted = await tx.negotiationOffer.findUniqueOrThrow({
      where: { id: offerId },
    });

    // 2. Reject all other pending offers for this order
    await tx.negotiationOffer.updateMany({
      where: { orderId, id: { not: offerId }, status: 'pending' },
      data: { status: 'rejected' },
    });

    // 3. Set final price on order and transition to accepted
    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: {
        finalPrice: accepted.amount,
        status: 'accepted',
      },
      include: { detail: true },
    });

    // 4. Create status event: negotiating → accepted
    await tx.statusEvent.create({
      data: {
        orderId,
        fromStatus: 'negotiating',
        toStatus: 'accepted',
        actorUserId: userId,
        actorRole: participantRole,
      },
    });

    return { offer: accepted, order: updatedOrder };
  });

  return result;
}

// ── Poll ───────────────────────────────────────────────────

export async function poll(orderId: string, sinceSeq: number) {
  const [messages, offers, statusEvents] = await Promise.all([
    prisma.message.findMany({
      where: { orderId, seq: { gt: sinceSeq } },
      orderBy: { seq: 'asc' },
    }),
    prisma.negotiationOffer.findMany({
      where: { orderId, seq: { gt: sinceSeq } },
      orderBy: { seq: 'asc' },
    }),
    prisma.statusEvent.findMany({
      where: { orderId, seq: { gt: sinceSeq } },
      orderBy: { seq: 'asc' },
    }),
  ]);

  // Find the max seq across all results for next poll cursor
  let maxSeq = sinceSeq;
  for (const m of messages) if (m.seq > maxSeq) maxSeq = m.seq;
  for (const o of offers) if (o.seq > maxSeq) maxSeq = o.seq;
  for (const s of statusEvents) if (s.seq > maxSeq) maxSeq = s.seq;

  return { messages, offers, statusEvents, lastSeq: maxSeq };
}
