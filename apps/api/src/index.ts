import express from 'express';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { authMiddleware } from './middleware/auth.middleware';
import { errorHandler } from './middleware/error.handler';
import { authRouter } from './routes/auth.routes';
import { userRouter } from './routes/user.routes';

const app = express();
const httpServer = createServer(app);
const io = new SocketServer(httpServer, {
  cors: {
    origin: config.cors.origins,
    credentials: true,
  },
});

// Middleware
app.use(helmet());
app.use(cors({ origin: config.cors.origins, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(
  rateLimit({
    windowMs: config.rateLimit.global.windowMs,
    max: config.rateLimit.global.max,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);
app.use(authMiddleware);

// Health check
app.get('/v1/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/v1/auth', authRouter);
app.use('/v1/users', userRouter);

// Error handler (must be last)
app.use(errorHandler);

// Start server
httpServer.listen(config.port, () => {
  console.log(
    `[babloo-api] listening on :${config.port} (${config.nodeEnv})`,
  );
});

export { app, io, httpServer };
