import { z } from 'zod';

export const createOfferSchema = z.object({
  amount: z.number().int().min(1),
});

export const messageSchema = z.object({
  content: z.string().max(2000).transform((s) => s.trim()).pipe(z.string().min(1, 'Le message ne peut pas être vide')),
  clientMessageId: z.string().uuid().optional(),
});

export const pollSchema = z.object({
  sinceSeq: z.coerce.number().int().min(0).default(0),
});

export const offerIdParam = z.object({
  id: z.string().uuid(),
  offerId: z.string().uuid(),
});
