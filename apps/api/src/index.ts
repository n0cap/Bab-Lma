import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { config } from './config';
import { app } from './app';

const httpServer = createServer(app);
const io = new SocketServer(httpServer, {
  cors: {
    origin: config.cors.origins,
    credentials: true,
  },
});

// Start server
httpServer.listen(config.port, () => {
  console.log(
    `[babloo-api] listening on :${config.port} (${config.nodeEnv})`,
  );
});

export { app, io, httpServer };
