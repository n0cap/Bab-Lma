import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, type JwtPayload } from '../utils/jwt';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

const PUBLIC_ROUTES: Array<{ method: string; path: string }> = [
  { method: 'POST', path: '/v1/auth/signup' },
  { method: 'POST', path: '/v1/auth/login' },
  { method: 'POST', path: '/v1/auth/otp/request' },
  { method: 'POST', path: '/v1/auth/otp/verify' },
  { method: 'POST', path: '/v1/auth/refresh' },
  { method: 'POST', path: '/v1/pricing/estimate' },
  { method: 'GET', path: '/v1/health' },
];

function isPublicRoute(method: string, path: string): boolean {
  return PUBLIC_ROUTES.some(
    (r) => r.method === method && r.path === path,
  );
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  if (isPublicRoute(req.method, req.path)) {
    return next();
  }

  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Token requis' },
    });
    return;
  }

  try {
    const token = header.slice(7);
    req.user = verifyAccessToken(token);
    next();
  } catch {
    res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Token invalide ou expiré' },
    });
  }
}
