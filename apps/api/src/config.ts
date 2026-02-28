import 'dotenv/config';

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: (process.env.NODE_ENV || 'development') === 'development',

  database: {
    url: process.env.DATABASE_URL!,
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-me',
    accessTtl: process.env.JWT_ACCESS_TTL || '15m',
    refreshTtl: process.env.JWT_REFRESH_TTL || '30d',
  },

  bcrypt: {
    rounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
  },

  otp: {
    ttlMinutes: parseInt(process.env.OTP_TTL_MINUTES || '5', 10),
    maxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS || '5', 10),
    rateLimitPer15Min: parseInt(
      process.env.OTP_RATE_LIMIT_PER_15MIN || '3',
      10,
    ),
    devBypassCode: '123456',
  },

  cors: {
    origins: (process.env.CORS_ORIGINS || 'http://localhost:8081').split(','),
  },

  rateLimit: {
    global: { windowMs: 60_000, max: 100 },
    auth: { windowMs: 60_000, max: 10 },
  },
} as const;
