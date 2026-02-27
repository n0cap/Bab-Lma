import { z } from 'zod';

export const createOfferSchema = z.object({
  amount: z.number().int().min(1),
});

export const messageSchema = z.object({
  content: z.string().min(1).max(2000).trim(),
  clientMessageId: z.string().uuid().optional(),
});

export const pollSchema = z.object({
  sinceSeq: z.coerce.number().int().min(0).default(0),
});
