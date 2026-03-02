import { Router, type Request, type Response, type NextFunction } from 'express';
import { paginationSchema } from '@babloo/shared';
import { z } from 'zod';
import { prisma } from '../db';
import { AppError } from '../middleware/error.handler';

export const proRouter = Router();
const availabilitySchema = z.object({ isAvailable: z.boolean() });
const assignmentIdSchema = z.object({ assignmentId: z.string().uuid() });

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
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
