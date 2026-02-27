import { z } from 'zod';

export const signupSchema = z
  .object({
    email: z.string().email().max(255).optional(),
    phone: z.string().min(8).max(20).optional(),
    password: z.string().min(8).max(128).optional(),
    fullName: z.string().min(1).max(100).trim(),
  })
  .refine((data) => data.email || data.phone, {
    message: 'Email ou numéro de téléphone requis',
  })
  .refine((data) => !data.email || data.password, {
    message: 'Mot de passe requis avec l\'email',
  });

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const otpRequestSchema = z.object({
  phone: z.string().min(8).max(20),
  purpose: z.enum(['login', 'signup', 'reset']),
});

export const otpVerifySchema = z.object({
  challengeId: z.string().uuid(),
  code: z.string().length(6).regex(/^\d{6}$/),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export const updateProfileSchema = z.object({
  fullName: z.string().min(1).max(100).trim().optional(),
  locale: z.enum(['fr', 'ar', 'en']).optional(),
  avatarUrl: z.string().url().optional().nullable(),
});
