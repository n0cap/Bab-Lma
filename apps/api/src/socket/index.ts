import type { Server } from 'socket.io';
import { socketAuthMiddleware, handleAuthRenew } from './auth';
import { registerHandlers } from './handlers';

/**
 * Set up Socket.IO server with auth middleware and event handlers.
 */
export function setupSocket(io: Server) {
  // Connection-level auth
  io.use(socketAuthMiddleware);

  io.on('connection', (socket) => {
    console.log(`[socket] connected: ${socket.data.userId} (${socket.id})`);

    // Auth renewal
    socket.on('auth:renew', (payload) => handleAuthRenew(socket, payload));

    // Register all event handlers
    registerHandlers(io, socket);

    socket.on('disconnect', (reason) => {
      console.log(`[socket] disconnected: ${socket.data.userId} (${reason})`);
    });
  });
}
