import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { config } from './config';
import { app } from './app';
import { setupSocket } from './socket';

const httpServer = createServer(app);
const io = new SocketServer(httpServer, {
  cors: {
    origin: config.cors.origins,
    credentials: true,
  },
});

// Wire Socket.IO auth + handlers
setupSocket(io);

// Start server
httpServer.listen(config.port, '0.0.0.0', () => {
  console.log(
    `[babloo-api] listening on 0.0.0.0:${config.port} (${config.nodeEnv})`,
  );
});

export { app, io, httpServer };
