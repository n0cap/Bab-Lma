import { Router, type Request, type Response, type NextFunction } from 'express';
import { paginationSchema } from '@babloo/shared';
import type { AssignmentStatus, TeamType } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../db';
import { AppError } from '../middleware/error.handler';

export const proRouter = Router();
const availabilitySchema = z.object({ isAvailable: z.boolean() });
const assignmentIdSchema = z.object({ assignmentId: z.string().uuid() });
const orderIdSchema = z.object({ orderId: z.string().uuid() });

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

function requiredTeamSize(teamType: TeamType | null | undefined, squadSize: number | null | undefined) {
  if (teamType === 'duo') return 2;
  if (teamType === 'squad' && squadSize && squadSize > 0) return squadSize;
  return null;
}

function countFilledSlots(assignments: Array<{ status: AssignmentStatus }>) {
  return assignments.filter((assignment) => assignment.status !== 'declined').length;
}

// GET /v1/pro/profile — current professional profile
proRouter.get(
  '/profile',
  asyncHandler(async (req, res) => {
    const userId = req.user!.userId;

    const professional = await prisma.professional.findUnique({
      where: { userId },
    });

    if (!professional) {
      throw new AppError(404, 'NOT_FOUND', 'Professional profile not found');
    }

    res.json({ data: professional });
  }),
);

// PATCH /v1/pro/availability — toggle availability
proRouter.patch(
  '/availability',
  asyncHandler(async (req, res) => {
    const userId = req.user!.userId;
    const { isAvailable } = availabilitySchema.parse(req.body);

    const professional = await prisma.professional.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!professional) {
      throw new AppError(404, 'NOT_FOUND', 'Professional profile not found');
    }

    const updated = await prisma.professional.update({
      where: { id: professional.id },
      data: { isAvailable },
      select: { isAvailable: true },
    });

    res.json({ data: updated });
  }),
);

// GET /v1/pro/orders — list orders assigned to this pro (cursor-paginated)
proRouter.get(
  '/orders',
  asyncHandler(async (req, res) => {
    const { cursor, limit } = paginationSchema.parse(req.query);
    const userId = req.user!.userId;

    const professional = await prisma.professional.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!professional) {
      throw new AppError(404, 'NOT_FOUND', 'Professional profile not found');
    }

    const take = limit + 1;

    const assignments = await prisma.orderAssignment.findMany({
      where: { professionalId: professional.id },
      orderBy: { assignedAt: 'desc' },
      take,
      ...(cursor
        ? {
            cursor: { id: cursor },
            skip: 1,
          }
        : {}),
      include: {
        order: {
          include: {
            detail: true,
            client: {
              select: {
                id: true,
                fullName: true,
                avatarUrl: true,
              },
            },
            statusEvents: {
              orderBy: { seq: 'asc' },
            },
          },
        },
      },
    });

    const hasMore = assignments.length > limit;
    const page = hasMore ? assignments.slice(0, limit) : assignments;
    const nextCursor = hasMore ? page[page.length - 1].id : undefined;

    const data = page.map((assignment) => ({
      ...assignment.order,
      assignmentStatus: assignment.status,
      assignmentId: assignment.id,
      assignedAt: assignment.assignedAt,
      confirmedAt: assignment.confirmedAt,
      isLead: assignment.isLead,
    }));

    res.json({ data, cursor: nextCursor, hasMore });
  }),
);

// GET /v1/pro/open-slots — accepted team orders with remaining open slots
proRouter.get(
  '/open-slots',
  asyncHandler(async (req, res) => {
    const userId = req.user!.userId;

    const professional = await prisma.professional.findUnique({
      where: { userId },
      select: {
        id: true,
        isAvailable: true,
        skills: true,
      },
    });

    if (!professional) {
      throw new AppError(404, 'NOT_FOUND', 'Professional profile not found');
    }

    if (!professional.isAvailable) {
      res.json({ data: [] });
      return;
    }

    const orders = await prisma.order.findMany({
      where: {
        status: 'accepted',
        serviceType: { in: professional.skills },
        detail: {
          is: {
            teamType: { in: ['duo', 'squad'] },
          },
        },
        assignments: {
          some: {
            isLead: true,
            status: 'confirmed',
          },
          none: {
            professionalId: professional.id,
            status: { not: 'declined' },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        detail: true,
        client: {
          select: {
            id: true,
            fullName: true,
          },
        },
        assignments: {
          select: {
            status: true,
            isLead: true,
          },
        },
      },
    });

    const data = orders
      .map((order) => {
        const totalSlots = requiredTeamSize(order.detail?.teamType, order.detail?.squadSize);
        if (!totalSlots) return null;

        const filledSlots = countFilledSlots(order.assignments);
        if (filledSlots >= totalSlots) return null;

        return {
          id: order.id,
          serviceType: order.serviceType,
          status: order.status,
          location: order.location,
          floorPrice: order.floorPrice,
          finalPrice: order.finalPrice,
          createdAt: order.createdAt,
          detail: {
            teamType: order.detail?.teamType,
            squadSize: order.detail?.squadSize,
          },
          client: order.client,
          filledSlots,
          totalSlots,
        };
      })
      .filter(Boolean);

    res.json({ data });
  }),
);

// POST /v1/pro/orders/:orderId/join-request — request slot in team order
proRouter.post(
  '/orders/:orderId/join-request',
  asyncHandler(async (req, res) => {
    const { orderId } = orderIdSchema.parse(req.params);
    const userId = req.user!.userId;

    const professional = await prisma.professional.findUnique({
      where: { userId },
      select: {
        id: true,
        isAvailable: true,
        skills: true,
      },
    });

    if (!professional) {
      throw new AppError(404, 'NOT_FOUND', 'Professional profile not found');
    }

    if (!professional.isAvailable) {
      throw new AppError(409, 'INVALID_STATE', 'Unavailable professionals cannot request to join');
    }

    const assignment = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          detail: true,
          assignments: {
            select: {
              id: true,
              professionalId: true,
              isLead: true,
              status: true,
            },
          },
        },
      });

      if (!order) {
        throw new AppError(404, 'NOT_FOUND', 'Order not found');
      }

      if (order.status !== 'accepted') {
        throw new AppError(409, 'INVALID_STATE', 'Join requests are only allowed for accepted orders');
      }

      const totalSlots = requiredTeamSize(order.detail?.teamType, order.detail?.squadSize);
      if (!totalSlots) {
        throw new AppError(409, 'INVALID_STATE', 'Order is not a team order');
      }

      if (!professional.skills.includes(order.serviceType)) {
        throw new AppError(403, 'FORBIDDEN', 'Professional does not match required service skill');
      }

      if (
        order.assignments.some(
          (entry) => entry.professionalId === professional.id && entry.status !== 'declined',
        )
      ) {
        throw new AppError(409, 'CONFLICT', 'Professional is already assigned to this order');
      }

      const leadConfirmed = order.assignments.some((entry) => entry.isLead && entry.status === 'confirmed');
      if (!leadConfirmed) {
        throw new AppError(409, 'INVALID_STATE', 'Lead must be confirmed before opening team slots');
      }

      const filledSlots = countFilledSlots(order.assignments);
      if (filledSlots >= totalSlots) {
        throw new AppError(409, 'INVALID_STATE', 'No open slots available');
      }

      const declinedAssignment = order.assignments.find(
        (entry) => entry.professionalId === professional.id && entry.status === 'declined',
      );

      if (declinedAssignment) {
        return tx.orderAssignment.update({
          where: { id: declinedAssignment.id },
          data: {
            status: 'assigned',
            confirmedAt: null,
            assignedAt: new Date(),
          },
        });
      }

      return tx.orderAssignment.create({
        data: {
          orderId,
          professionalId: professional.id,
          isLead: false,
          status: 'assigned',
        },
      });
    });

    res.status(201).json({ data: assignment });
  }),
);

// GET /v1/pro/orders/:orderId/join-requests — lead-only pending join requests
proRouter.get(
  '/orders/:orderId/join-requests',
  asyncHandler(async (req, res) => {
    const { orderId } = orderIdSchema.parse(req.params);
    const userId = req.user!.userId;

    const professional = await prisma.professional.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!professional) {
      throw new AppError(404, 'NOT_FOUND', 'Professional profile not found');
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        assignments: {
          include: {
            professional: {
              include: {
                user: {
                  select: {
                    id: true,
                    fullName: true,
                    avatarUrl: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new AppError(404, 'NOT_FOUND', 'Order not found');
    }

    const callerIsLead = order.assignments.some(
      (assignment) =>
        assignment.professionalId === professional.id
        && assignment.isLead
        && assignment.status === 'confirmed',
    );

    if (!callerIsLead) {
      throw new AppError(403, 'FORBIDDEN', 'Only the lead can view join requests');
    }

    const pending = order.assignments
      .filter((assignment) => !assignment.isLead && assignment.status === 'assigned')
      .map((assignment) => ({
        id: assignment.id,
        status: assignment.status,
        assignedAt: assignment.assignedAt,
        confirmedAt: assignment.confirmedAt,
        professional: {
          id: assignment.professional.id,
          rating: assignment.professional.rating,
          reliability: assignment.professional.reliability,
          totalSessions: assignment.professional.totalSessions,
          user: assignment.professional.user,
        },
      }));

    const confirmed = order.assignments
      .filter((assignment) => !assignment.isLead && assignment.status === 'confirmed')
      .map((assignment) => ({
        id: assignment.id,
        status: assignment.status,
        assignedAt: assignment.assignedAt,
        confirmedAt: assignment.confirmedAt,
        professional: {
          id: assignment.professional.id,
          rating: assignment.professional.rating,
          reliability: assignment.professional.reliability,
          totalSessions: assignment.professional.totalSessions,
          user: assignment.professional.user,
        },
      }));

    res.json({ data: { pending, confirmed } });
  }),
);

// PATCH /v1/pro/assignments/:assignmentId/approve — lead approves pending join request
proRouter.patch(
  '/assignments/:assignmentId/approve',
  asyncHandler(async (req, res) => {
    const { assignmentId } = assignmentIdSchema.parse(req.params);
    const userId = req.user!.userId;

    const professional = await prisma.professional.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!professional) {
      throw new AppError(404, 'NOT_FOUND', 'Professional profile not found');
    }

    const updated = await prisma.$transaction(async (tx) => {
      const assignment = await tx.orderAssignment.findUnique({
        where: { id: assignmentId },
        include: {
          order: {
            include: {
              assignments: {
                select: {
                  professionalId: true,
                  isLead: true,
                  status: true,
                },
              },
            },
          },
        },
      });

      if (!assignment) {
        throw new AppError(404, 'NOT_FOUND', 'Assignment not found');
      }

      if (assignment.isLead) {
        throw new AppError(409, 'INVALID_STATE', 'Cannot approve lead assignment');
      }

      if (assignment.status !== 'assigned') {
        throw new AppError(409, 'INVALID_STATE', 'Join request is not pending');
      }

      const callerIsLead = assignment.order.assignments.some(
        (entry) =>
          entry.professionalId === professional.id
          && entry.isLead
          && entry.status === 'confirmed',
      );

      if (!callerIsLead) {
        throw new AppError(403, 'FORBIDDEN', 'Only the lead can approve join requests');
      }

      return tx.orderAssignment.update({
        where: { id: assignmentId },
        data: {
          status: 'confirmed',
          confirmedAt: new Date(),
        },
      });
    });

    res.json({ data: updated });
  }),
);

// PATCH /v1/pro/assignments/:assignmentId/reject — lead rejects pending join request
proRouter.patch(
  '/assignments/:assignmentId/reject',
  asyncHandler(async (req, res) => {
    const { assignmentId } = assignmentIdSchema.parse(req.params);
    const userId = req.user!.userId;

    const professional = await prisma.professional.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!professional) {
      throw new AppError(404, 'NOT_FOUND', 'Professional profile not found');
    }

    const updated = await prisma.$transaction(async (tx) => {
      const assignment = await tx.orderAssignment.findUnique({
        where: { id: assignmentId },
        include: {
          order: {
            include: {
              assignments: {
                select: {
                  professionalId: true,
                  isLead: true,
                  status: true,
                },
              },
            },
          },
        },
      });

      if (!assignment) {
        throw new AppError(404, 'NOT_FOUND', 'Assignment not found');
      }

      if (assignment.isLead) {
        throw new AppError(409, 'INVALID_STATE', 'Cannot reject lead assignment');
      }

      if (assignment.status !== 'assigned') {
        throw new AppError(409, 'INVALID_STATE', 'Join request is not pending');
      }

      const callerIsLead = assignment.order.assignments.some(
        (entry) =>
          entry.professionalId === professional.id
          && entry.isLead
          && entry.status === 'confirmed',
      );

      if (!callerIsLead) {
        throw new AppError(403, 'FORBIDDEN', 'Only the lead can reject join requests');
      }

      return tx.orderAssignment.update({
        where: { id: assignmentId },
        data: {
          status: 'declined',
          confirmedAt: null,
        },
      });
    });

    res.json({ data: updated });
  }),
);

// POST /v1/pro/assignments/:assignmentId/decline — decline assignment only
proRouter.post(
  '/assignments/:assignmentId/decline',
  asyncHandler(async (req, res) => {
    const { assignmentId } = assignmentIdSchema.parse(req.params);
    const userId = req.user!.userId;

    const professional = await prisma.professional.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!professional) {
      throw new AppError(404, 'NOT_FOUND', 'Professional profile not found');
    }

    const assignment = await prisma.orderAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        order: {
          select: { status: true },
        },
      },
    });

    if (!assignment || assignment.professionalId !== professional.id) {
      throw new AppError(404, 'NOT_FOUND', 'Assignment not found');
    }

    if (assignment.order.status !== 'negotiating') {
      throw new AppError(409, 'INVALID_STATE', 'Assignment can only be declined while negotiating');
    }

    if (assignment.status !== 'assigned') {
      throw new AppError(409, 'INVALID_STATE', 'Assignment is not pending');
    }

    const updated = await prisma.orderAssignment.update({
      where: { id: assignmentId },
      data: { status: 'declined' },
    });

    res.json({ data: updated });
  }),
);
