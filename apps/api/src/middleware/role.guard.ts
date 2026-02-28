import type { Request, Response, NextFunction } from 'express';

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({
        error: { code: 'FORBIDDEN', message: 'Accès interdit' },
      });
      return;
    }
    next();
  };
}
