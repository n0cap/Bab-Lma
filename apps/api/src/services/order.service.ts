import { prisma } from '../db';
import { computePrice, isValidTransition, ServiceType } from '@babloo/shared';
import type { PricingParams } from '@babloo/shared';
import type { CleanType, TeamType } from '@prisma/client';
import { AppError } from '../middleware/error.handler';

// ── types ────────────────────────────────────────────────

interface CreateOrderInput {
  serviceType: string;
  location: string;
  scheduledStartAt?: string;
  detail: Record<string, unknown>;
}

interface ListOrdersInput {
  userId: string;
  cursor?: string;
  limit: number;
}

// ── helpers ──────────────────────────────────────────────

function extractPricingParams(serviceType: string, detail: Record<string, unknown>): PricingParams {
  switch (serviceType) {
    case 'menage':
      return {
        surface: detail.surface as number,
        cleanType: detail.cleanType as string,
        teamType: detail.teamType as string,
        squadSize: detail.squadSize as number | undefined,
      } as PricingParams;
    case 'cuisine':
      return { guests: detail.guests as number } as PricingParams;
    case 'childcare':
      return {
        children: detail.children as number,
        hours: detail.hours as number,
      } as PricingParams;
    default:
      throw new AppError(400, 'VALIDATION_ERROR', `Type de service inconnu: ${serviceType}`);
  }
}

function buildDetailData(serviceType: string, detail: Record<string, unknown>) {
  switch (serviceType) {
    case 'menage':
      return {
        surface: detail.surface as number,
        cleanType: detail.cleanType as CleanType,
        teamType: detail.teamType as TeamType,
        squadSize: (detail.squadSize as number) ?? null,
        notes: (detail.notes as string) ?? null,
      };
    case 'cuisine':
      return {
        guests: detail.guests as number,
        dishes: (detail.dishes as string) ?? null,
      };
    case 'childcare':
      return {
        children: detail.children as number,
        hours: detail.hours as number,
        notes: (detail.notes as string) ?? null,
      };
    default:
      throw new AppError(400, 'VALIDATION_ERROR', `Type de service inconnu: ${serviceType}`);
  }
}

// ── create ───────────────────────────────────────────────

export async function create(userId: string, input: CreateOrderInput) {
  const params = extractPricingParams(input.serviceType, input.detail);
  const pricing = computePrice(input.serviceType as ServiceType, params);

  const order = await prisma.$transaction(async (tx) => {
    // 1. Create order in draft state
    const newOrder = await tx.order.create({
      data: {
        clientId: userId,
        serviceType: input.serviceType as any,
        status: 'draft',
        floorPrice: pricing.floorPrice,
        location: input.location,
        scheduledStartAt: input.scheduledStartAt ? new Date(input.scheduledStartAt) : null,
      },
    });

    // 2. Create order detail
    await tx.orderDetail.create({
      data: {
        orderId: newOrder.id,
        ...buildDetailData(input.serviceType, input.detail),
      },
    });

    // 3. StatusEvent: null → draft (creation event)
    await tx.statusEvent.create({
      data: {
        orderId: newOrder.id,
        fromStatus: 'draft',
        toStatus: 'draft',
        actorUserId: userId,
        actorRole: 'client',
      },
    });

    // 4. Transition draft → submitted
    const submitted = await tx.order.update({
      where: { id: newOrder.id },
      data: { status: 'submitted' },
      include: { detail: true },
    });

    // 5. StatusEvent: draft → submitted
    await tx.statusEvent.create({
      data: {
        orderId: newOrder.id,
        fromStatus: 'draft',
        toStatus: 'submitted',
        actorUserId: userId,
        actorRole: 'client',
      },
    });

    return submitted;
  });

  return {
    ...order,
    pricing: {
      floorPrice: pricing.floorPrice,
      ceiling: pricing.ceiling,
      durationMinutes: pricing.durationMinutes,
    },
  };
}

// ── list ─────────────────────────────────────────────────

export async function list(input: ListOrdersInput) {
  const take = input.limit + 1; // fetch one extra to determine hasMore

  const orders = await prisma.order.findMany({
    where: { clientId: input.userId },
    orderBy: { createdAt: 'desc' },
    take,
    ...(input.cursor
      ? {
          cursor: { id: input.cursor },
          skip: 1, // skip the cursor itself
        }
      : {}),
    include: { detail: true },
  });

  const hasMore = orders.length > input.limit;
  const data = hasMore ? orders.slice(0, input.limit) : orders;
  const nextCursor = hasMore ? data[data.length - 1].id : undefined;

  return { data, cursor: nextCursor, hasMore };
}

// ── getById ──────────────────────────────────────────────

export async function getById(userId: string, orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      detail: true,
      statusEvents: { orderBy: { seq: 'asc' } },
      rating: true,
    },
  });

  if (!order || order.clientId !== userId) {
    throw new AppError(404, 'NOT_FOUND', 'Commande non trouvée');
  }

  return order;
}

// ── cancel ───────────────────────────────────────────────

export async function cancel(userId: string, orderId: string, reason?: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });

  if (!order || order.clientId !== userId) {
    throw new AppError(404, 'NOT_FOUND', 'Commande non trouvée');
  }

  if (!isValidTransition(order.status as any, 'cancelled' as any)) {
    throw new AppError(409, 'INVALID_TRANSITION', 'Cette commande ne peut pas être annulée');
  }

  const updated = await prisma.$transaction(async (tx) => {
    const cancelled = await tx.order.update({
      where: { id: orderId },
      data: { status: 'cancelled' },
      include: { detail: true },
    });

    await tx.statusEvent.create({
      data: {
        orderId,
        fromStatus: order.status,
        toStatus: 'cancelled',
        actorUserId: userId,
        actorRole: 'client',
        reason: reason ?? null,
      },
    });

    return cancelled;
  });

  return updated;
}

// ── submitRating ────────────────────────────────────────

export async function submitRating(
  userId: string,
  orderId: string,
  stars: number,
  comment?: string,
) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { rating: true, assignments: true },
  });

  if (!order || order.clientId !== userId) {
    throw new AppError(404, 'NOT_FOUND', 'Commande non trouvée');
  }

  if (order.status !== 'completed') {
    throw new AppError(409, 'INVALID_STATE', 'Seules les commandes terminées peuvent être évaluées');
  }

  if (order.rating) {
    throw new AppError(409, 'ALREADY_RATED', 'Cette commande a déjà été évaluée');
  }

  const result = await prisma.$transaction(async (tx) => {
    // 1. Create rating
    const rating = await tx.rating.create({
      data: {
        orderId,
        clientId: userId,
        stars,
        comment: comment?.trim() || null,
      },
    });

    // 2. Update professional stats (weighted average rating + totalSessions)
    for (const assignment of order.assignments) {
      const pro = await tx.professional.findUnique({
        where: { id: assignment.professionalId },
      });
      if (pro) {
        const newTotal = pro.totalSessions + 1;
        const newRating = (pro.rating * pro.totalSessions + stars) / newTotal;
        await tx.professional.update({
          where: { id: pro.id },
          data: {
            rating: Math.round(newRating * 100) / 100,
            totalSessions: newTotal,
          },
        });
      }
    }

    return rating;
  });

  return result;
}

// ── updateStatus (pro) ──────────────────────────────────

export async function updateStatus(
  userId: string,
  orderId: string,
  toStatus: string,
  reason?: string,
) {
  // Import checkParticipant lazily to avoid circular deps
  const { checkParticipant } = await import('../services/negotiation.service');
  const { order, participantRole } = await checkParticipant(userId, orderId);

  if (participantRole !== 'pro') {
    throw new AppError(403, 'FORBIDDEN', 'Seul le professionnel peut mettre à jour le statut');
  }

  if (!isValidTransition(order.status as any, toStatus as any)) {
    throw new AppError(409, 'INVALID_TRANSITION', 'Transition de statut invalide');
  }

  const updated = await prisma.$transaction(async (tx) => {
    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: { status: toStatus as any },
      include: { detail: true },
    });

    await tx.statusEvent.create({
      data: {
        orderId,
        fromStatus: order.status,
        toStatus: toStatus as any,
        actorUserId: userId,
        actorRole: participantRole,
        reason: reason ?? null,
      },
    });

    return updatedOrder;
  });

  return updated;
}
