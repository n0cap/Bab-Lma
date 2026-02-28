import { prisma } from '../db';
import { AppError } from '../middleware/error.handler';

// ── Order status override ───────────────────────────────

export async function overrideOrderStatus(
  adminUserId: string,
  orderId: string,
  toStatus: string,
  reason?: string,
) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    throw new AppError(404, 'NOT_FOUND', 'Commande non trouvée');
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
        actorUserId: adminUserId,
        actorRole: 'admin',
        reason: reason ?? null,
      },
    });

    await tx.auditLog.create({
      data: {
        action: 'order.status.override',
        entityType: 'Order',
        entityId: orderId,
        actorUserId: adminUserId,
        actorRole: 'admin',
        metadata: { fromStatus: order.status, toStatus, reason },
      },
    });

    return updatedOrder;
  });

  return updated;
}

// ── Order price override ────────────────────────────────

export async function overrideOrderPrice(
  adminUserId: string,
  orderId: string,
  finalPrice: number,
  reason?: string,
) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    throw new AppError(404, 'NOT_FOUND', 'Commande non trouvée');
  }

  const updated = await prisma.$transaction(async (tx) => {
    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: { finalPrice },
      include: { detail: true },
    });

    await tx.auditLog.create({
      data: {
        action: 'order.price.override',
        entityType: 'Order',
        entityId: orderId,
        actorUserId: adminUserId,
        actorRole: 'admin',
        metadata: { previousPrice: order.finalPrice, newPrice: finalPrice, reason },
      },
    });

    return updatedOrder;
  });

  return updated;
}

// ── User active toggle ──────────────────────────────────

export async function toggleUserActive(
  adminUserId: string,
  targetUserId: string,
  isActive: boolean,
) {
  const user = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!user) {
    throw new AppError(404, 'NOT_FOUND', 'Utilisateur non trouvé');
  }

  const updated = await prisma.$transaction(async (tx) => {
    const updatedUser = await tx.user.update({
      where: { id: targetUserId },
      data: { isActive },
      select: { id: true, email: true, phone: true, fullName: true, role: true, isActive: true },
    });

    await tx.auditLog.create({
      data: {
        action: isActive ? 'user.activate' : 'user.suspend',
        entityType: 'User',
        entityId: targetUserId,
        actorUserId: adminUserId,
        actorRole: 'admin',
        metadata: { previousIsActive: user.isActive, newIsActive: isActive },
      },
    });

    return updatedUser;
  });

  return updated;
}

// ── Audit log ───────────────────────────────────────────

export async function getAuditLog(cursor?: string, limit: number = 20) {
  const take = limit + 1;

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take,
    ...(cursor
      ? { cursor: { id: cursor }, skip: 1 }
      : {}),
    include: {
      actor: { select: { id: true, fullName: true, role: true } },
    },
  });

  const hasMore = logs.length > limit;
  const data = hasMore ? logs.slice(0, limit) : logs;
  const nextCursor = hasMore ? data[data.length - 1].id : undefined;

  return { data, cursor: nextCursor, hasMore };
}
