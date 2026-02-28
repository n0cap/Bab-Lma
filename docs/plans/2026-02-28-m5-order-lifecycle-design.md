# M5: Order Lifecycle — Design Document

## Scope

Status tracking, cancel, rating, admin endpoints, and order history polish.

## Gap Analysis

**Already exists (M3/M4):**
- FSM with forward transitions + cancellation (`packages/shared/src/fsm.ts`)
- Order create, list, getById, cancel — service + REST routes
- Socket-based `status:update` handler (pro advances order)
- StatusEvent timeline in `OrderDetailScreen`
- Cancel button on `OrderDetailScreen`
- All Zod schemas: `updateStatusSchema`, `ratingSchema`, `cancelOrderSchema`
- Prisma schema: `Rating`, `AuditLog`, `StatusEvent` tables ready

**Missing (this milestone):**

### Section 1 — API: Rating & Pro Status Update

1. **Rating service** (`order.service.ts`)
   - `submitRating(userId, orderId, stars, comment?)` — only client, only on `completed` orders, one rating per order
   - On create: update `Professional.rating` (weighted average) and `Professional.totalSessions` (increment)
   - Transaction: create Rating + update Professional atomically

2. **Pro status update REST route** — `PATCH /v1/orders/:id/status`
   - Pro-only (role guard via `checkParticipant`)
   - Validates FSM transition via `isValidTransition`
   - Creates StatusEvent, updates Order
   - Same logic as socket `status:update` handler but via REST

3. **Rating REST route** — `POST /v1/orders/:id/rating`
   - Client-only (must be order owner)
   - Order must be in `completed` status
   - Returns created Rating

### Section 2 — API: Admin Routes

4. **Admin router** (`routes/admin.routes.ts`)
   - Role-guarded: only `role=admin`
   - `PATCH /v1/admin/orders/:id/status` — override any status (skip FSM)
   - `PATCH /v1/admin/orders/:id/price` — override finalPrice
   - `PATCH /v1/admin/users/:id` — suspend/activate user (`isActive` toggle)
   - `GET /v1/admin/audit-log` — paginated audit trail

5. **Admin service** (`services/admin.service.ts`)
   - All admin mutations create an `AuditLog` entry
   - actorRole = 'admin' for all StatusEvents created by admin

### Section 3 — Mobile: Rating & History Polish

6. **Rating screen** (`screens/orders/RatingScreen.tsx`)
   - Star picker (1-5), optional comment textarea
   - Shows service type + date for context
   - Submit → navigate back to OrderDetail

7. **Rating mutation** (`services/mutations/orders.ts`)
   - `useSubmitRating(orderId)` — POST to `/orders/:id/rating`

8. **OrderDetailScreen enhancements**
   - Show existing rating (stars + comment) if order is completed and rated
   - "Évaluer" button when completed and not yet rated → navigates to RatingScreen
   - Update OrdersStack param list to include Rating route

9. **OrdersListScreen tabs**
   - Two tabs: "En cours" (active = non-terminal) and "Historique" (completed + cancelled)
   - Filter client-side from same query data
   - Tab indicator with navy underline

10. **i18n additions** for rating UI and admin strings

### Section 4 — Tests

11. **Rating + status update route tests** (`__tests__/order-lifecycle.routes.test.ts`)
12. **Admin route tests** (`__tests__/admin.routes.test.ts`)

## Acceptance Criteria

- Client can rate a completed order (1-5 stars + optional comment)
- Rating updates professional's average rating and session count
- Duplicate rating on same order → 409
- Pro can advance order status via REST (not just socket)
- Admin can override order status, price, and user active state
- All admin actions logged in AuditLog
- OrdersListScreen has active/history tabs
- OrderDetailScreen shows rating or "Rate" CTA
- All 4 validation checks pass
- Route tests cover happy paths and error cases
