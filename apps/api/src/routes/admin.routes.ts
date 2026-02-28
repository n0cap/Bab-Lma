import { Router, type Request, type Response, type NextFunction } from 'express';
import {
  adminStatusOverrideSchema,
  adminPriceOverrideSchema,
  adminUserToggleSchema,
  paginationSchema,
  uuidParam,
} from '@babloo/shared';
import { validate } from '../middleware/validate';
import { requireRole } from '../middleware/role.guard';
import * as adminService from '../services/admin.service';

export const adminRouter = Router();

// All admin routes require admin role
adminRouter.use(requireRole('admin'));

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

// PATCH /v1/admin/orders/:id/status — override order status (no FSM check)
adminRouter.patch(
  '/orders/:id/status',
  validate(adminStatusOverrideSchema),
  asyncHandler(async (req, res) => {
    const { id } = uuidParam.parse(req.params);
    const order = await adminService.overrideOrderStatus(
      req.user!.userId,
      id,
      req.body.toStatus,
      req.body.reason,
    );
    res.json({ data: order });
  }),
);

// PATCH /v1/admin/orders/:id/price — override order price
adminRouter.patch(
  '/orders/:id/price',
  validate(adminPriceOverrideSchema),
  asyncHandler(async (req, res) => {
    const { id } = uuidParam.parse(req.params);
    const order = await adminService.overrideOrderPrice(
      req.user!.userId,
      id,
      req.body.finalPrice,
      req.body.reason,
    );
    res.json({ data: order });
  }),
);

// PATCH /v1/admin/users/:id — suspend/activate user
adminRouter.patch(
  '/users/:id',
  validate(adminUserToggleSchema),
  asyncHandler(async (req, res) => {
    const { id } = uuidParam.parse(req.params);
    const user = await adminService.toggleUserActive(
      req.user!.userId,
      id,
      req.body.isActive,
    );
    res.json({ data: user });
  }),
);

// GET /v1/admin/audit-log — paginated audit trail
adminRouter.get(
  '/audit-log',
  asyncHandler(async (req, res) => {
    const { cursor, limit } = paginationSchema.parse(req.query);
    const result = await adminService.getAuditLog(cursor, limit);
    res.json(result);
  }),
);
