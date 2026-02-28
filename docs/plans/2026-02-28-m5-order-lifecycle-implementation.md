# M5: Order Lifecycle — Implementation Plan

## Task List

### Task 1: Rating service + REST route
**Files:** `apps/api/src/services/order.service.ts`, `apps/api/src/routes/order.routes.ts`
**Changes:**
- Add `submitRating(userId, orderId, stars, comment?)` to order service
  - Verify order exists and user is the client
  - Verify order status is `completed`
  - Check no existing rating (unique constraint will catch, but preflight for clear error)
  - Transaction: create Rating + update Professional.rating (weighted avg) + increment Professional.totalSessions
- Add `getOrderWithRating(userId, orderId)` — extends getById to include rating
- Add route `POST /v1/orders/:id/rating` with `validate(ratingSchema)`
- Update `GET /v1/orders/:id` to include rating relation
**Validation gate:** API tsc + API tests

### Task 2: Pro status update REST route
**Files:** `apps/api/src/routes/order.routes.ts`, `apps/api/src/services/order.service.ts`
**Changes:**
- Add `updateStatus(userId, orderId, toStatus, reason?)` to order service
  - Use `checkParticipant` from negotiation service to verify pro role
  - Validate FSM transition via `isValidTransition`
  - Transaction: update order status + create StatusEvent
- Add route `PATCH /v1/orders/:id/status` with `validate(updateStatusSchema)`
- Role guard: only assigned pro (via checkParticipant)
**Validation gate:** API tsc + API tests

### Task 3: Admin service
**Files:** `apps/api/src/services/admin.service.ts` (new)
**Changes:**
- `overrideOrderStatus(adminUserId, orderId, toStatus, reason?)` — no FSM check, creates StatusEvent with actorRole=admin + AuditLog entry
- `overrideOrderPrice(adminUserId, orderId, price)` — updates finalPrice + AuditLog
- `toggleUserActive(adminUserId, targetUserId, isActive)` — updates user isActive + AuditLog
- `getAuditLog(cursor?, limit)` — paginated, newest first
**Validation gate:** API tsc

### Task 4: Admin routes + role guard
**Files:** `apps/api/src/routes/admin.routes.ts` (new), `apps/api/src/app.ts`
**Changes:**
- Create admin router with role guard middleware (check `req.user.role === 'admin'`)
- `PATCH /v1/admin/orders/:id/status` → `adminService.overrideOrderStatus`
- `PATCH /v1/admin/orders/:id/price` → `adminService.overrideOrderPrice`
- `PATCH /v1/admin/users/:id` → `adminService.toggleUserActive`
- `GET /v1/admin/audit-log` → `adminService.getAuditLog`
- Register `/v1/admin` in app.ts
- Add Zod schemas: `adminStatusOverrideSchema`, `adminPriceOverrideSchema`, `adminUserToggleSchema`
**Validation gate:** API tsc

### Task 5: Order lifecycle route tests
**Files:** `apps/api/src/__tests__/order-lifecycle.routes.test.ts` (new)
**Changes:**
- Test `POST /orders/:id/rating`: happy path, duplicate 409, non-owner 404, non-completed 409
- Test `PATCH /orders/:id/status`: happy path pro advancement, invalid FSM 409, non-participant 403
**Validation gate:** API tests pass

### Task 6: Admin route tests
**Files:** `apps/api/src/__tests__/admin.routes.test.ts` (new)
**Changes:**
- Test admin status override, price override, user toggle, audit log
- Test non-admin gets 403
**Validation gate:** API tests pass

### Task 7: Rating screen + mutation (mobile)
**Files:** `apps/mobile/src/screens/orders/RatingScreen.tsx` (new), `apps/mobile/src/services/mutations/orders.ts`, `apps/mobile/src/navigation/OrdersStack.tsx`
**Changes:**
- Create `RatingScreen` with star picker (5 touchable stars), optional comment TextInput, submit button
- Add `useSubmitRating` mutation
- Add `Rating` route to OrdersStack param list
- Register screen in navigator
**Validation gate:** mobile tsc

### Task 8: OrderDetailScreen rating display + CTA
**Files:** `apps/mobile/src/screens/orders/OrderDetailScreen.tsx`, `apps/mobile/src/services/queries/orders.ts`
**Changes:**
- Update `useOrder` query to include rating relation (already returned if we add `include: { rating: true }` in service)
- Show rating card (stars + comment) below timeline when order has rating
- Show "Évaluer" button when status=completed and no rating
- Navigate to RatingScreen on tap
**Validation gate:** mobile tsc

### Task 9: OrdersListScreen active/history tabs
**Files:** `apps/mobile/src/screens/orders/OrdersListScreen.tsx`
**Changes:**
- Add tab bar with "En cours" and "Historique"
- "En cours": filter orders where status NOT in [completed, cancelled]
- "Historique": filter orders where status IN [completed, cancelled]
- Navy underline on active tab
- Client-side filter from same useOrders data
**Validation gate:** mobile tsc

### Task 10: i18n additions
**Files:** `apps/mobile/src/i18n/fr.json`
**Changes:**
- Add `rating` section: title, starLabel, commentPlaceholder, submit, success, alreadyRated
- Add `orders.tabActive`, `orders.tabHistory`
**Validation gate:** mobile tsc

### Task 11: Shared validation schemas for admin
**Files:** `packages/shared/src/validation/orders.ts`, `packages/shared/src/validation/index.ts`
**Changes:**
- Add `adminStatusOverrideSchema`, `adminPriceOverrideSchema`, `adminUserToggleSchema`
- Export from index
**Validation gate:** shared tests + API tsc

### Task 12: Final validation + cleanup
- Run all 4 checks
- Verify no TODOs or incomplete code
- Clean git status

## Execution Order

1. Task 11 (shared schemas — dependency for Tasks 3-4)
2. Task 1 (rating service + route)
3. Task 2 (pro status update route)
4. Task 3 (admin service)
5. Task 4 (admin routes)
6. Task 5 (order lifecycle tests)
7. Task 6 (admin tests)
8. Task 7 (rating screen + mutation)
9. Task 8 (OrderDetail rating display)
10. Task 9 (orders list tabs)
11. Task 10 (i18n)
12. Task 12 (final validation)

## Verification Gates

After each API task: `pnpm --filter @babloo/api exec tsc --noEmit`
After each mobile task: `pnpm --filter @babloo/mobile exec tsc --noEmit`
After test tasks: `pnpm --filter @babloo/api exec vitest run`
Final: all 4 checks
