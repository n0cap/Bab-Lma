import { z } from 'zod';

export const createOrderSchema = z.object({
  serviceType: z.enum(['menage', 'cuisine', 'childcare']),
  location: z.string().min(1).max(100),
  scheduledStartAt: z.string().datetime().optional(),
  detail: z.discriminatedUnion('serviceType', [
    z.object({
      serviceType: z.literal('menage'),
      surface: z.number().int().min(20).max(1000),
      cleanType: z.enum(['simple', 'deep']),
      teamType: z.enum(['solo', 'duo', 'squad']),
      squadSize: z.number().int().min(3).max(5).optional(),
      notes: z.string().max(500).trim().optional(),
    }),
    z.object({
      serviceType: z.literal('cuisine'),
      guests: z.number().int().min(1).max(20),
      dishes: z.string().max(500).trim().optional(),
    }),
    z.object({
      serviceType: z.literal('childcare'),
      children: z.number().int().min(1).max(6),
      hours: z.number().int().min(1).max(12),
      notes: z.string().max(500).trim().optional(),
    }),
  ]),
});

export const cancelOrderSchema = z.object({
  reason: z.string().max(500).trim().optional(),
});

export const updateStatusSchema = z.object({
  toStatus: z.enum([
    'submitted',
    'searching',
    'negotiating',
    'accepted',
    'en_route',
    'in_progress',
    'completed',
    'cancelled',
  ]),
  reason: z.string().max(500).trim().optional(),
});

export const ratingSchema = z.object({
  stars: z.number().int().min(1).max(5),
  comment: z.string().max(1000).trim().optional(),
});

export const pricingEstimateSchema = z.discriminatedUnion('serviceType', [
  z.object({
    serviceType: z.literal('menage'),
    surface: z.number().int().min(20).max(1000),
    cleanType: z.enum(['simple', 'deep']),
    teamType: z.enum(['solo', 'duo', 'squad']),
    squadSize: z.number().int().min(3).max(5).optional(),
  }),
  z.object({
    serviceType: z.literal('cuisine'),
    guests: z.number().int().min(1).max(20),
  }),
  z.object({
    serviceType: z.literal('childcare'),
    children: z.number().int().min(1).max(6),
    hours: z.number().int().min(1).max(12),
  }),
]);
