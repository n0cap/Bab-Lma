import { Router, type Request, type Response, type NextFunction } from 'express';
import {
  messageSchema,
  createOfferSchema,
  pollSchema,
  uuidParam,
  offerIdParam,
  paginationSchema,
} from '@babloo/shared';
import { validate } from '../middleware/validate';
import * as negotiationService from '../services/negotiation.service';

export const negotiationRouter = Router({ mergeParams: true });

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

// GET /v1/orders/:id/messages — list messages (seq-paginated)
negotiationRouter.get(
  '/messages',
  asyncHandler(async (req, res) => {
    const { id } = uuidParam.parse(req.params);
    const { sinceSeq } = pollSchema.parse(req.query);
    const { limit } = paginationSchema.parse(req.query);

    await negotiationService.checkParticipant(req.user!.userId, id);
    const messages = await negotiationService.listMessages(id, sinceSeq, limit);
    res.json({ data: messages });
  }),
);

// POST /v1/orders/:id/messages — send message
negotiationRouter.post(
  '/messages',
  validate(messageSchema),
  asyncHandler(async (req, res) => {
    const { id } = uuidParam.parse(req.params);
    const { participantRole } = await negotiationService.checkParticipant(req.user!.userId, id);

    const message = await negotiationService.sendMessage(
      req.user!.userId,
      id,
      req.body.content,
      participantRole,
      req.body.clientMessageId,
    );
    res.status(201).json({ data: message });
  }),
);

// GET /v1/orders/:id/offers — list offers
negotiationRouter.get(
  '/offers',
  asyncHandler(async (req, res) => {
    const { id } = uuidParam.parse(req.params);
    await negotiationService.checkParticipant(req.user!.userId, id);

    const offers = await negotiationService.listOffers(id);
    res.json({ data: offers });
  }),
);

// POST /v1/orders/:id/offers — create offer
negotiationRouter.post(
  '/offers',
  validate(createOfferSchema),
  asyncHandler(async (req, res) => {
    const { id } = uuidParam.parse(req.params);
    const { order } = await negotiationService.checkParticipant(req.user!.userId, id);

    const offer = await negotiationService.createOffer(
      req.user!.userId,
      id,
      req.body.amount,
      order,
    );
    res.status(201).json({ data: offer });
  }),
);

// POST /v1/orders/:id/offers/:offerId/accept — accept offer & lock price
negotiationRouter.post(
  '/offers/:offerId/accept',
  asyncHandler(async (req, res) => {
    const { id, offerId } = offerIdParam.parse(req.params);
    const { order, participantRole } = await negotiationService.checkParticipant(req.user!.userId, id);

    const result = await negotiationService.acceptOffer(
      req.user!.userId,
      id,
      offerId,
      order,
      participantRole,
    );
    res.json({ data: result });
  }),
);

// GET /v1/orders/:id/poll — polling fallback
negotiationRouter.get(
  '/poll',
  asyncHandler(async (req, res) => {
    const { id } = uuidParam.parse(req.params);
    const { sinceSeq } = pollSchema.parse(req.query);

    await negotiationService.checkParticipant(req.user!.userId, id);
    const result = await negotiationService.poll(id, sinceSeq);
    res.json({ data: result });
  }),
);
