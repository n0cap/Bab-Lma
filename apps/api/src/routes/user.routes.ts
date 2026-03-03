import { Router, type Request, type Response, type NextFunction } from 'express';
import { updateProfileSchema } from '@babloo/shared';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { prisma } from '../db';
import { AppError } from '../middleware/error.handler';
import { COMMON } from '../constants/errors';

export const userRouter = Router();

const pushTokenSchema = z.object({
  token: z.string().trim().min(1),
  platform: z.enum(['ios', 'android']),
});

const unregisterPushTokenSchema = z.object({
  token: z.string().trim().min(1),
});

function isExpoPushToken(token: string) {
  return token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken[');
}

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
  if (!user) throw new AppError(404, 'NOT_FOUND', COMMON.NOT_FOUND);
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

userRouter.post('/push-token', validate(pushTokenSchema), asyncHandler(async (req, res) => {
  const { token } = req.body as z.infer<typeof pushTokenSchema>;
  if (!isExpoPushToken(token)) {
    throw new AppError(400, 'VALIDATION_ERROR', COMMON.VALIDATION_ERROR);
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: { pushTokens: true },
  });

  if (!user) {
    throw new AppError(404, 'NOT_FOUND', COMMON.NOT_FOUND);
  }

  if (!user.pushTokens.includes(token)) {
    await prisma.user.update({
      where: { id: req.user!.userId },
      data: {
        pushTokens: {
          set: [...user.pushTokens, token],
        },
      },
    });
  }

  res.json({ success: true });
}));

userRouter.delete('/push-token', validate(unregisterPushTokenSchema), asyncHandler(async (req, res) => {
  const { token } = req.body as z.infer<typeof unregisterPushTokenSchema>;

  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: { pushTokens: true },
  });

  if (!user) {
    throw new AppError(404, 'NOT_FOUND', COMMON.NOT_FOUND);
  }

  await prisma.user.update({
    where: { id: req.user!.userId },
    data: {
      pushTokens: {
        set: user.pushTokens.filter((existingToken) => existingToken !== token),
      },
    },
  });

  res.json({ success: true });
}));
