import { Router, type Request, type Response, type NextFunction } from 'express';
import { createOrderSchema, cancelOrderSchema, updateStatusSchema, ratingSchema, paginationSchema, uuidParam } from '@babloo/shared';
import { validate } from '../middleware/validate';
import * as orderService from '../services/order.service';

export const orderRouter = Router();

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

// POST /v1/orders — create order
orderRouter.post(
  '/',
  validate(createOrderSchema),
  asyncHandler(async (req, res) => {
    const order = await orderService.create(req.user!.userId, req.body);
    res.status(201).json({ data: order });
  }),
);

// GET /v1/orders — list my orders (cursor-paginated)
orderRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { cursor, limit } = paginationSchema.parse(req.query);
    const result = await orderService.list({
      userId: req.user!.userId,
      cursor,
      limit,
    });
    res.json(result);
  }),
);

// GET /v1/orders/:id — get order detail
orderRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = uuidParam.parse(req.params);
    const order = await orderService.getById(req.user!.userId, id);
    res.json({ data: order });
  }),
);

// POST /v1/orders/:id/cancel — cancel order
orderRouter.post(
  '/:id/cancel',
  asyncHandler(async (req, res) => {
    const { id } = uuidParam.parse(req.params);
    const body = cancelOrderSchema.parse(req.body ?? {});
    const order = await orderService.cancel(req.user!.userId, id, body.reason);
    res.json({ data: order });
  }),
);

// PATCH /v1/orders/:id/status — pro updates status
orderRouter.patch(
  '/:id/status',
  validate(updateStatusSchema),
  asyncHandler(async (req, res) => {
    const { id } = uuidParam.parse(req.params);
    const order = await orderService.updateStatus(
      req.user!.userId,
      id,
      req.body.toStatus,
      req.body.reason,
    );
    res.json({ data: order });
  }),
);

// POST /v1/orders/:id/rating — client rates completed order
orderRouter.post(
  '/:id/rating',
  validate(ratingSchema),
  asyncHandler(async (req, res) => {
    const { id } = uuidParam.parse(req.params);
    const rating = await orderService.submitRating(
      req.user!.userId,
      id,
      req.body.stars,
      req.body.comment,
    );
    res.status(201).json({ data: rating });
  }),
);
