import { Router, type Request, type Response, type NextFunction } from 'express';
import { updateProfileSchema } from '@babloo/shared';
import { validate } from '../middleware/validate';
import { prisma } from '../db';
import { AppError } from '../middleware/error.handler';

export const userRouter = Router();

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

userRouter.get('/me', asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: {
      id: true, email: true, phone: true, fullName: true,
      role: true, locale: true, avatarUrl: true, isActive: true,
      createdAt: true, updatedAt: true,
    },
  });
  if (!user) throw new AppError(404, 'NOT_FOUND', 'Utilisateur non trouvé');
  res.json({ data: user });
}));

userRouter.patch('/me', validate(updateProfileSchema), asyncHandler(async (req, res) => {
  const user = await prisma.user.update({
    where: { id: req.user!.userId },
    data: req.body,
    select: {
      id: true, email: true, phone: true, fullName: true,
      role: true, locale: true, avatarUrl: true, isActive: true,
      createdAt: true, updatedAt: true,
    },
  });
  res.json({ data: user });
}));
