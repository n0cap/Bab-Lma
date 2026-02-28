import { Router, type Request, type Response, type NextFunction } from 'express';
import { pricingEstimateSchema, computePrice, ServiceType } from '@babloo/shared';
import { validate } from '../middleware/validate';

export const pricingRouter = Router();

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

// POST /v1/pricing/estimate (public — listed in auth middleware PUBLIC_ROUTES)
pricingRouter.post(
  '/estimate',
  validate(pricingEstimateSchema),
  asyncHandler(async (req, res) => {
    const { serviceType, ...params } = req.body;
    const result = computePrice(serviceType as ServiceType, params);
    res.json({ data: result });
  }),
);
