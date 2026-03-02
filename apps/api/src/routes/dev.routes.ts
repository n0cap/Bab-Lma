import { Router, type Request, type Response, type NextFunction } from 'express';
import { prisma } from '../db';
import { AppError } from '../middleware/error.handler';
import { uuidParam } from '@babloo/shared';

export const devRouter = Router();

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

function normalizeToken(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function extractZoneTokens(location: string) {
  return location
    .split(/[,\s-]+/g)
    .map((token) => normalizeToken(token))
    .filter(Boolean);
}

// POST /v1/dev/orders/:id/simulate
devRouter.post(
  '/orders/:id/simulate',
  asyncHandler(async (req, res) => {
    const { id } = uuidParam.parse(req.params);
    const userId = req.user!.userId;

    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order || order.clientId !== userId) {
      throw new AppError(404, 'NOT_FOUND', 'Commande non trouvée');
    }
    if (order.status !== 'submitted') {
      throw new AppError(409, 'INVALID_STATE', 'La commande doit être au statut submitted');
    }

    const zoneTokens = extractZoneTokens(order.location);
    const prosBySkill = await prisma.professional.findMany({
      where: {
        isAvailable: true,
        skills: { has: order.serviceType },
      },
      orderBy: [
        { reliability: 'desc' },
        { rating: 'desc' },
      ],
    });

    const zoneMatch = prosBySkill.find((pro) => {
      const normalizedZones = pro.zones.map((zone) => normalizeToken(zone));
      return normalizedZones.some((zone) => zoneTokens.includes(zone));
    });
    let selected: (typeof prosBySkill)[number] | null = zoneMatch ?? prosBySkill[0] ?? null;
    if (!selected) {
      selected = await prisma.professional.findFirst({
        where: { isAvailable: true },
        orderBy: [
          { reliability: 'desc' },
          { rating: 'desc' },
        ],
      });
    }
    if (!selected) {
      throw new AppError(409, 'NO_AVAILABLE_PRO', 'Aucune professionnelle disponible');
    }

    const updated = await prisma.$transaction(async (tx) => {
      const searchingOrder = await tx.order.update({
        where: { id },
        data: { status: 'searching' },
      });

      await tx.statusEvent.create({
        data: {
          orderId: id,
          fromStatus: order.status,
          toStatus: 'searching',
          actorUserId: userId,
          actorRole: 'client',
        },
      });

      await tx.orderAssignment.create({
        data: {
          orderId: id,
          professionalId: selected.id,
          isLead: true,
          status: 'assigned',
        },
      });

      await tx.order.update({
        where: { id },
        data: { status: 'negotiating' },
      });

      await tx.statusEvent.create({
        data: {
          orderId: id,
          fromStatus: searchingOrder.status,
          toStatus: 'negotiating',
          actorUserId: userId,
          actorRole: 'client',
        },
      });

      return tx.order.findUniqueOrThrow({
        where: { id },
        include: {
          assignments: {
            include: { professional: { include: { user: true } } },
          },
          detail: true,
          statusEvents: { orderBy: { seq: 'asc' } },
        },
      });
    });

    res.json({ data: updated });
  }),
);

// POST /v1/dev/orders/:id/complete
devRouter.post(
  '/orders/:id/complete',
  asyncHandler(async (req, res) => {
    const { id } = uuidParam.parse(req.params);
    const userId = req.user!.userId;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        assignments: {
          include: { professional: { include: { user: true } } },
        },
      },
    });

    if (!order || order.clientId !== userId) {
      throw new AppError(404, 'NOT_FOUND', 'Commande non trouvée');
    }
    if (!['negotiating', 'accepted', 'en_route', 'in_progress'].includes(order.status)) {
      throw new AppError(409, 'INVALID_STATE', 'La commande doit être en négociation ou acceptée');
    }

    const leadAssignment = order.assignments.find((a) => a.isLead) ?? order.assignments[0];
    if (!leadAssignment) {
      throw new AppError(409, 'INVALID_STATE', 'Aucune professionnelle assignée');
    }

    const proUserId = leadAssignment.professional.userId;

    const updated = await prisma.$transaction(async (tx) => {
      let currentStatus = order.status;
      if (currentStatus === 'negotiating') {
        await tx.order.update({
          where: { id },
          data: {
            status: 'accepted',
            finalPrice: order.floorPrice,
          },
        });
        await tx.statusEvent.create({
          data: {
            orderId: id,
            fromStatus: 'negotiating',
            toStatus: 'accepted',
            actorUserId: proUserId,
            actorRole: 'pro',
          },
        });
        currentStatus = 'accepted';
      }

      if (currentStatus === 'accepted') {
        await tx.order.update({
          where: { id },
          data: { status: 'en_route' },
        });
        await tx.statusEvent.create({
          data: {
            orderId: id,
            fromStatus: 'accepted',
            toStatus: 'en_route',
            actorUserId: proUserId,
            actorRole: 'pro',
          },
        });
        currentStatus = 'en_route';
      }

      if (currentStatus === 'en_route') {
        await tx.order.update({
          where: { id },
          data: { status: 'in_progress' },
        });
        await tx.statusEvent.create({
          data: {
            orderId: id,
            fromStatus: 'en_route',
            toStatus: 'in_progress',
            actorUserId: proUserId,
            actorRole: 'pro',
          },
        });
        currentStatus = 'in_progress';
      }

      if (currentStatus === 'in_progress') {
        await tx.order.update({
          where: { id },
          data: { status: 'completed' },
        });
        await tx.statusEvent.create({
          data: {
            orderId: id,
            fromStatus: 'in_progress',
            toStatus: 'completed',
            actorUserId: proUserId,
            actorRole: 'pro',
          },
        });
      }

      return tx.order.findUniqueOrThrow({
        where: { id },
        include: {
          assignments: {
            include: { professional: { include: { user: true } } },
          },
          detail: true,
          statusEvents: { orderBy: { seq: 'asc' } },
          rating: true,
        },
      });
    });

    res.json({ data: updated });
  }),
);
