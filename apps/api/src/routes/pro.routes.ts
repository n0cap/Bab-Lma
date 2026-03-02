import { Router, type Request, type Response, type NextFunction } from 'express';
import { paginationSchema } from '@babloo/shared';
import { prisma } from '../db';
import { AppError } from '../middleware/error.handler';

export const proRouter = Router();

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

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
