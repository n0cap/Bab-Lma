# M3: Booking & Pricing Design Document

## Goal

Deliver the core client booking flow end-to-end: service selection → pricing estimate → order creation → order list + detail view. API-first, then mobile screens. No real-time (Socket.IO) or pro-side flows in this milestone.

## Scope

### In Scope
- **API: Pricing estimate endpoint** (`POST /v1/pricing/estimate`) — public, uses shared `computePrice()`
- **API: Order CRUD** — create (draft → submitted), list (client's orders, cursor-paginated), get by ID, cancel
- **API: Order service layer** — business logic: compute price, create Order + OrderDetail + StatusEvent, FSM enforcement, cancel with reason
- **API: Order routes** — auth-protected except pricing estimate
- **API: Order tests** — pricing estimate validation, order route validation/middleware, order service unit tests
- **Mobile: Service selection screen** — pick service type, enter details (surface/guests/children), get live estimate
- **Mobile: Order confirmation screen** — review details + price, schedule (optional), confirm → creates order
- **Mobile: Orders list screen** — replace placeholder with real data, cursor-pagination, pull-to-refresh
- **Mobile: Order detail screen** — view order status, details, pricing, cancel button (if cancellable)
- **Mobile: TanStack Query hooks** — mutations (create order, cancel order) and queries (list orders, get order)

### Out of Scope
- Pro dashboard / assignment flow (M4)
- Negotiation / messaging (M5)
- Socket.IO real-time events (M5)
- Rating flow (M5)
- Payment processing
- Admin panel

## Architecture

### API Layer

```
POST /v1/pricing/estimate  → validate(pricingEstimateSchema) → computePrice() → respond
POST /v1/orders            → validate(createOrderSchema) → orderService.create() → respond
GET  /v1/orders            → validate(paginationSchema) → orderService.list(userId) → respond
GET  /v1/orders/:id        → validate(uuidParam) → orderService.getById(userId, orderId) → respond
POST /v1/orders/:id/cancel → validate(cancelOrderSchema) → orderService.cancel(userId, orderId) → respond
```

**Service pattern:** Thin routes → `order.service.ts` → Prisma. Same pattern as `auth.service.ts`.

### Order Creation Flow

1. Client sends `createOrderSchema` (serviceType, location, detail, optional scheduledStartAt)
2. Service computes price via `computePrice(serviceType, detail)`
3. Creates Order (status: `draft`, floorPrice from computation) + OrderDetail in a transaction
4. Creates initial StatusEvent (null → draft, actor: client)
5. Immediately transitions to `submitted` (creates second StatusEvent, draft → submitted)
6. Returns order with detail and price breakdown

**Why draft → submitted in one step:** The client mobile app doesn't have a "save draft" concept yet. The create endpoint atomically creates and submits. If drafts are needed later, the transition can be split.

### Pricing Estimate Flow

1. Client sends service-specific params via `pricingEstimateSchema`
2. Server validates and calls `computePrice()`
3. Returns `{ floorPrice, ceiling, durationMinutes }`
4. Mobile uses this for live preview before order confirmation

### Order List (Cursor Pagination)

- Cursor-based on `createdAt` (ISO string) + `id` for stability
- Default limit: 20, max: 50
- Sorted by `createdAt DESC` (newest first)
- Filtered to `clientId = req.user.userId`

### Cancel Flow

1. Client sends optional reason
2. Service checks: order belongs to user, status is cancellable (not terminal)
3. Uses `isValidTransition(currentStatus, 'cancelled')` from shared FSM
4. Updates Order status, creates StatusEvent
5. Returns updated order

### Mobile Layer

```
HomeScreen → "Book Service" button
  → ServiceSelectionScreen (pick type)
    → ServiceDetailScreen (enter params, see estimate)
      → OrderConfirmScreen (review, schedule, confirm)
        → OrderDetailScreen (see result)

OrdersListScreen (tab) → OrderDetailScreen (on tap)
```

**State management:**
- TanStack Query for server state (orders, pricing)
- Local React state for form inputs
- Query invalidation after create/cancel

## Data Flow Diagram

```
Mobile                          API                         DB
  │                              │                          │
  ├─ POST /pricing/estimate ────►│                          │
  │◄─ {floor, ceiling, dur} ─────│  computePrice()          │
  │                              │                          │
  ├─ POST /orders ──────────────►│                          │
  │                              ├─ computePrice()          │
  │                              ├─ $transaction ──────────►│
  │                              │   create Order           │
  │                              │   create OrderDetail     │
  │                              │   create StatusEvent×2   │
  │◄─ {order, detail, price} ────│◄─────────────────────────│
  │                              │                          │
  ├─ GET /orders?cursor=... ────►│                          │
  │◄─ {data[], cursor, hasMore}──│  findMany + take+1 ─────►│
  │                              │                          │
  ├─ GET /orders/:id ───────────►│                          │
  │◄─ {order, detail, events} ──│  findUnique + include ──►│
  │                              │                          │
  ├─ POST /orders/:id/cancel ──►│                          │
  │                              ├─ FSM validate            │
  │                              ├─ $transaction ──────────►│
  │                              │   update status          │
  │                              │   create StatusEvent     │
  │◄─ {order} ──────────────────│◄─────────────────────────│
```

## Error Handling

| Scenario | HTTP | Code | Message (FR) |
|----------|------|------|-------------|
| Invalid input | 400 | VALIDATION_ERROR | Données invalides |
| Not authenticated | 401 | UNAUTHORIZED | Token requis |
| Order not found / not yours | 404 | NOT_FOUND | Commande non trouvée |
| FSM violation (e.g., cancel completed) | 409 | INVALID_TRANSITION | Transition invalide |
| Squad size missing for squad team | 400 | VALIDATION_ERROR | (field-level) |

## Key Design Decisions

1. **Draft → Submitted is atomic**: Simplifies mobile flow. No dangling drafts.
2. **Price computed server-side on create**: Even though client can preview, the server recomputes to prevent tampered prices.
3. **Cursor pagination over offset**: Stable under concurrent inserts, no page-drift.
4. **No idempotency on create yet**: Planned but deferred — requires `idempotencyKey` middleware (M4).
5. **StatusEvent audit trail**: Every state change is logged with actor, timestamp, and reason.
