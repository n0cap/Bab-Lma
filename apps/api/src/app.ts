import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { authMiddleware } from './middleware/auth.middleware';
import { errorHandler } from './middleware/error.handler';
import { authRouter } from './routes/auth.routes';
import { userRouter } from './routes/user.routes';
import { pricingRouter } from './routes/pricing.routes';
import { orderRouter } from './routes/order.routes';
import { negotiationRouter } from './routes/negotiation.routes';
import { adminRouter } from './routes/admin.routes';

const app = express();

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
app.use('/v1/pricing', pricingRouter);
app.use('/v1/orders', orderRouter);
app.use('/v1/orders/:id', negotiationRouter);
app.use('/v1/admin', adminRouter);

// Error handler (must be last)
app.use(errorHandler);

export { app };
