import { Router, type Request, type Response, type NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { signupSchema, loginSchema, otpRequestSchema, otpVerifySchema, refreshSchema } from '@babloo/shared';
import { validate } from '../middleware/validate';
import { config } from '../config';
import * as authService from '../services/auth.service';

export const authRouter = Router();

const authLimiter = rateLimit({
  windowMs: config.rateLimit.auth.windowMs,
  max: config.rateLimit.auth.max,
  standardHeaders: true,
  legacyHeaders: false,
});

authRouter.use(authLimiter);

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

authRouter.post('/signup', validate(signupSchema), asyncHandler(async (req, res) => {
  const tokens = await authService.signup(req.body);
  res.status(201).json({ data: tokens });
}));

authRouter.post('/login', validate(loginSchema), asyncHandler(async (req, res) => {
  const tokens = await authService.login(req.body.email, req.body.password);
  res.json({ data: tokens });
}));

authRouter.post('/otp/request', validate(otpRequestSchema), asyncHandler(async (req, res) => {
  const result = await authService.otpRequest(req.body.phone, req.body.purpose);
  res.json({ data: result });
}));

authRouter.post('/otp/verify', validate(otpVerifySchema), asyncHandler(async (req, res) => {
  const tokens = await authService.otpVerify(req.body.challengeId, req.body.code);
  res.json({ data: tokens });
}));

authRouter.post('/refresh', validate(refreshSchema), asyncHandler(async (req, res) => {
  const tokens = await authService.refresh(req.body.refreshToken);
  res.json({ data: tokens });
}));

authRouter.post('/logout', asyncHandler(async (req, res) => {
  await authService.logout(req.user!.userId, req.body.refreshToken);
  res.json({ data: { message: 'Déconnecté' } });
}));

authRouter.post('/logout-all', asyncHandler(async (req, res) => {
  await authService.logoutAll(req.user!.userId);
  res.json({ data: { message: 'Toutes les sessions fermées' } });
}));
