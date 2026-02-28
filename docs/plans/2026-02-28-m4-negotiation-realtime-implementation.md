# M4: Negotiation & Real-time — Implementation Plan

## Prerequisites
- Branch: `codex/m4-negotiation-realtime` off latest `main`
- Baseline: 55 shared + 35 API tests passing, tsc clean on api + mobile

## Verification Commands (run after each batch)
```bash
pnpm --filter @babloo/shared test
pnpm --filter @babloo/api test
pnpm --filter @babloo/api exec tsc --noEmit
pnpm --filter @babloo/mobile exec tsc --noEmit
```

---

## Batch 1: API Negotiation Service + Routes (Tasks 1-3)

### Task 1: Negotiation Service

**Files:**
- Create: `apps/api/src/services/negotiation.service.ts`

**Functions:**
- `checkParticipant(userId, orderId)` — verifies user is client or assigned pro, throws 403 if not
- `listMessages(orderId, sinceSeq, limit)` — seq-paginated messages
- `sendMessage(userId, orderId, content, clientMessageId?)` — create message, handle clientMessageId dedup
- `listOffers(orderId)` — all offers for order
- `createOffer(userId, orderId, amount)` — validate floor/ceiling/step, auto-reject prev pending, create offer
- `acceptOffer(userId, orderId, offerId)` — atomic: accept offer, set finalPrice, transition negotiating→accepted
- `poll(orderId, sinceSeq)` — combined messages + offers + statusEvents since seq

**Business rules:**
- Participant = `order.clientId === userId` OR exists `OrderAssignment` where `professionalId` matches user's Professional record
- Offer amount: `floor ≤ amount ≤ ceiling`, `amount % 5 === 0` (ceiling = `round(floor * 2.5)`)
- Accept: offerer !== acceptor (can't accept own offer)
- Accept is `$transaction`: update offer status, set order.finalPrice, create StatusEvent, update order status
- Message dedup: if `clientMessageId` exists, return existing message

### Task 2: Negotiation REST Routes

**Files:**
- Create: `apps/api/src/routes/negotiation.routes.ts`
- Modify: `apps/api/src/app.ts` — wire negotiation router

**Endpoints:**
```
GET    /v1/orders/:id/messages          → listMessages
POST   /v1/orders/:id/messages          → sendMessage
GET    /v1/orders/:id/offers            → listOffers
POST   /v1/orders/:id/offers            → createOffer
POST   /v1/orders/:id/offers/:offerId/accept → acceptOffer
GET    /v1/orders/:id/poll              → poll
```

All require JWT auth. Use `uuidParam` for `:id` and a new `offerIdParam` for `:offerId`.

### Task 3: Shared Validation Updates

**Files:**
- Modify: `packages/shared/src/validation/negotiation.ts` — add `offerIdParam` schema
- Modify: `packages/shared/src/validation/common.ts` — add `offerIdParam` if needed

Add validation for offer acceptance params and poll query params.

**Checkpoint:** `tsc --noEmit` clean on api + shared. Commit.

---

## Batch 2: Negotiation Tests (Tasks 4-5)

### Task 4: Negotiation Service Unit Tests

**Files:**
- Create: `apps/api/src/__tests__/negotiation.service.test.ts`

**Test cases (mocked Prisma):**
- `checkParticipant` — client access OK, pro access OK, non-participant throws 403
- `sendMessage` — creates message, dedup with clientMessageId returns existing
- `createOffer` — validates floor/ceiling/step, rejects out of range, auto-rejects prev pending
- `acceptOffer` — locks price, rejects self-accept, rejects if not negotiating
- `poll` — returns combined results since seq

### Task 5: Negotiation Route Integration Tests

**Files:**
- Create: `apps/api/src/__tests__/negotiation.routes.test.ts`

**Test cases:**
- Auth required on all endpoints
- UUID validation on orderId/offerId
- Message creation returns 201
- Offer creation validates amount bounds
- Accept offer returns updated order with finalPrice
- Poll returns combined data

**Checkpoint:** All tests pass. Commit.

---

## Batch 3: Socket.IO Server (Tasks 6-8)

### Task 6: Socket Auth Middleware

**Files:**
- Create: `apps/api/src/socket/auth.ts`

**Implementation:**
- Connection middleware: verify JWT from `socket.handshake.auth.token`, attach `userId` + `role` to `socket.data`
- Per-event wrapper: `withAuth(handler)` that re-verifies token on each event
- `auth:renew` handler: update `socket.data` with new token

### Task 7: Socket Event Handlers

**Files:**
- Create: `apps/api/src/socket/handlers.ts`

**Events:**
- `join:order` — verify participation, join room `order:{orderId}`
- `leave:order` — leave room
- `message:send` — validate → persist via negotiation service → emit `message:new` to room
- `offer:create` — validate → persist → emit `offer:new` to room
- `offer:accept` — validate → lock price → emit `offer:accepted` + `order:updated` to room
- `typing:start` — emit `typing:indicator` to room (no persist)
- `status:update` — validate FSM → persist → emit `order:updated` to room

### Task 8: Wire Socket.IO into Server

**Files:**
- Modify: `apps/api/src/index.ts` — import and register socket handlers
- Create: `apps/api/src/socket/index.ts` — setup function that takes `io` and registers all middleware + handlers

**Checkpoint:** tsc clean, all tests pass. Commit.

---

## Batch 4: Mobile Socket Integration (Tasks 9-10)

### Task 9: SocketContext Provider

**Files:**
- Create: `apps/mobile/src/contexts/SocketContext.tsx`

**Implementation:**
- Wraps app, connects socket when authenticated (from AuthContext)
- Disconnects on logout
- Exposes `socket` instance and `isConnected` state
- On reconnect: re-join active order rooms
- On `auth:expired`: trigger token refresh from AuthContext, then `auth:renew`

### Task 10: Socket → TanStack Query Cache Bridge

**Files:**
- Create: `apps/mobile/src/hooks/useSocketEvents.ts`

**Implementation:**
- Hook that listens to socket events and writes to query cache:
  - `message:new` → append to `['messages', orderId]` query data
  - `offer:new` → append to `['offers', orderId]` query data
  - `offer:accepted` → invalidate `['orders', orderId]` and `['orders']`
  - `order:updated` → invalidate `['orders', orderId]` and `['orders']`
  - `typing:indicator` → update local typing state (not query cache)

**Checkpoint:** tsc clean on mobile. Commit.

---

## Batch 5: Mobile Negotiation Hooks (Tasks 11-12)

### Task 11: Message & Offer Queries

**Files:**
- Create: `apps/mobile/src/services/queries/negotiation.ts`

**Hooks:**
- `useMessages(orderId)` — infinite query with seq-based pagination
- `useOffers(orderId)` — standard query
- `usePoll(orderId, sinceSeq, enabled)` — polling fallback, enabled only when socket disconnected

### Task 12: Message & Offer Mutations

**Files:**
- Create: `apps/mobile/src/services/mutations/negotiation.ts`

**Hooks:**
- `useSendMessage()` — optimistic update, uses clientMessageId for dedup
- `useCreateOffer()` — invalidates offers cache
- `useAcceptOffer()` — invalidates orders + offers cache

**Checkpoint:** tsc clean on mobile. Commit.

---

## Batch 6: Mobile Chat Screen (Tasks 13-15)

### Task 13: ChatScreen

**Files:**
- Create: `apps/mobile/src/screens/chat/ChatScreen.tsx`

**Implementation:**
- FlatList (inverted) of messages + inline offer cards
- TextInput with send button
- Typing indicator
- Auto-scroll on new messages
- Uses `useMessages`, `useSendMessage`, socket typing events

### Task 14: NegotiationBar Component

**Files:**
- Create: `apps/mobile/src/components/NegotiationBar.tsx`

**Implementation:**
- Horizontal slider from floor to ceiling (step 5 MAD)
- Current amount display
- "Proposer" button to send offer
- Shows last pending offer from other party with "Accepter" button
- Inline in ChatScreen when status=negotiating

### Task 15: Wire Chat into Navigation

**Files:**
- Modify: `apps/mobile/src/navigation/OrdersStack.tsx` — add ChatScreen
- Modify: `apps/mobile/src/screens/orders/OrderDetailScreen.tsx` — add "Négocier" button
- Modify: `apps/mobile/src/i18n/fr.json` — chat/negotiation translations
- Modify: `apps/mobile/App.tsx` — wrap with SocketContext

**Checkpoint:** tsc clean on mobile. Commit.

---

## Batch 7: Final Updates & Validation (Tasks 16-17)

### Task 16: Update OrderDetail + OrdersList for Negotiation

**Files:**
- Modify: `apps/mobile/src/screens/orders/OrderDetailScreen.tsx` — show finalPrice, negotiation badge
- Modify: `apps/mobile/src/screens/orders/OrdersListScreen.tsx` — show finalPrice when available

### Task 17: Final Validation

**Steps:**
1. `pnpm --filter @babloo/shared test` — 55/55
2. `pnpm --filter @babloo/api test` — all pass (auth + pricing + order + negotiation)
3. `pnpm --filter @babloo/api exec tsc --noEmit` — clean
4. `pnpm --filter @babloo/mobile exec tsc --noEmit` — clean
5. `git diff --stat` — full M4 diff
6. Report results

---

## Task Summary

| Batch | Tasks | Scope | Commit message pattern |
|-------|-------|-------|----------------------|
| 1 | 1-3 | API negotiation service + routes | `feat(api): add negotiation service and REST routes` |
| 2 | 4-5 | Negotiation tests | `test: add negotiation service and route tests` |
| 3 | 6-8 | Socket.IO server | `feat(api): add Socket.IO auth, handlers, and wiring` |
| 4 | 9-10 | Mobile socket integration | `feat(mobile): add SocketContext and cache bridge` |
| 5 | 11-12 | Mobile negotiation hooks | `feat(mobile): add negotiation queries and mutations` |
| 6 | 13-15 | Mobile chat screen | `feat(mobile): add chat screen with negotiation bar` |
| 7 | 16-17 | Final updates + validation | `feat(mobile): update order screens for negotiation` |
