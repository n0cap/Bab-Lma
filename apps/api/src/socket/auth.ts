import type { Socket } from 'socket.io';
import { verifyAccessToken, type JwtPayload } from '../utils/jwt';
import { AppError } from '../middleware/error.handler';

const GENERIC_ERROR = 'Erreur interne';

/** Return user-safe message: AppError messages are intentional, everything else is generic. */
function safeMessage(err: unknown): string {
  if (err instanceof AppError) return err.message;
  return GENERIC_ERROR;
}

/**
 * Socket.IO connection middleware: verify JWT from handshake auth.
 * Attaches userId, role, locale to socket.data on success.
 */
export function socketAuthMiddleware(socket: Socket, next: (err?: Error) => void) {
  const token = socket.handshake.auth?.token;
  if (!token || typeof token !== 'string') {
    return next(new Error('Token requis'));
  }

  try {
    const payload = verifyAccessToken(token);
    socket.data.userId = payload.userId;
    socket.data.role = payload.role;
    socket.data.locale = payload.locale;
    next();
  } catch {
    next(new Error('Token invalide ou expiré'));
  }
}

/**
 * Per-event auth guard. Wraps a handler so it checks socket.data.userId
 * before executing. Awaits async handlers and catches unhandled rejections.
 */
export function withAuth(
  socket: Socket,
  handler: (payload: any) => Promise<void> | void,
): (payload: any) => void {
  return (payload: any) => {
    if (!socket.data.userId) {
      socket.emit('auth:expired', { message: 'Veuillez vous reconnecter' });
      return;
    }
    try {
      const result = handler(payload);
      if (result && typeof result.catch === 'function') {
        result.catch((err: unknown) => {
          console.error('[socket] unhandled handler error:', err);
          socket.emit('error', { message: safeMessage(err) });
        });
      }
    } catch (err: unknown) {
      console.error('[socket] sync handler error:', err);
      socket.emit('error', { message: safeMessage(err) });
    }
  };
}

/**
 * Handle auth:renew event — client sends a fresh token to re-authenticate.
 */
export function handleAuthRenew(socket: Socket, payload: { token: string }) {
  if (!payload?.token || typeof payload.token !== 'string') {
    socket.emit('auth:expired', { message: 'Token requis' });
    return;
  }

  try {
    const decoded: JwtPayload = verifyAccessToken(payload.token);
    socket.data.userId = decoded.userId;
    socket.data.role = decoded.role;
    socket.data.locale = decoded.locale;
    socket.emit('auth:renewed', { userId: decoded.userId });
  } catch {
    socket.emit('auth:expired', { message: 'Token invalide' });
  }
}
