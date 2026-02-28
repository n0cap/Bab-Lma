# M4: Negotiation & Real-time — Design Document

## Scope

M4 combines M4a (Negotiation REST) and M4b (Real-time Layer) from the MVP roadmap:

- **M4a**: Chat messages (REST + Socket), negotiation offers, price lock transaction
- **M4b**: Socket.IO server wiring, per-event auth, room management, polling fallback

## What Exists (from M1–M3)

| Layer | Already built |
|-------|--------------|
| **Prisma schema** | `Message`, `NegotiationOffer`, `StatusEvent`, `OrderAssignment` models with seq-based indexes |
| **Shared validation** | `messageSchema`, `createOfferSchema`, `pollSchema`, `updateStatusSchema`, `ratingSchema` |
| **Shared FSM** | `isValidTransition()`, `getValidNextStatuses()` with forward-only + cancel from any non-terminal |
| **Shared enums** | `OfferStatus`, `ActorRole`, `OrderStatus`, `AssignmentStatus` |
| **API** | Express app with auth middleware, order CRUD, pricing endpoint, error handler with ZodError catch |
| **Socket.IO** | Server instantiated in `index.ts` (`io`), exported but not wired. Mobile `socket.ts` with `connectSocket(token)` |
| **Mobile** | Order hooks (`useOrders`, `useOrder`, `useCreateOrder`, `useCancelOrder`), booking flow screens, orders list/detail |

## What We Build

### 1. Negotiation Service (API)

Business logic for the chat + offer + price-lock flow:

```
Order (status: negotiating)
  ├── Messages (seq-ordered, client↔pro↔system)
  ├── NegotiationOffers (seq-ordered, amount ≥ floor, ≤ ceiling, multiple of 5)
  └── Price Lock: accept offer → set finalPrice, transition → accepted
```

**Key rules:**
- Only the order's client + assigned pro(s) can send messages/offers
- Offers must satisfy: `floor ≤ amount ≤ ceiling`, `amount % 5 === 0`
- Only one pending offer per user at a time (previous auto-rejected)
- Only the *other* party can accept an offer (client can't accept own offer)
- Accepting an offer is atomic: set `offer.status=accepted`, `order.finalPrice=amount`, create StatusEvent `negotiating→accepted`
- `clientMessageId` on Message enables idempotent sends (Socket reconnects)

### 2. Message & Offer REST Routes

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/v1/orders/:id/messages` | JWT (participant) | Chat history (seq-paginated) |
| POST | `/v1/orders/:id/messages` | JWT (participant) | Send message (REST fallback) |
| GET | `/v1/orders/:id/offers` | JWT (participant) | Offer history |
| POST | `/v1/orders/:id/offers` | JWT (participant) | Create offer |
| POST | `/v1/orders/:id/offers/:offerId/accept` | JWT (other party) | Accept & lock price |
| GET | `/v1/orders/:id/poll` | JWT (participant) | Polling fallback (sinceSeq) |

**Participant check:** `order.clientId === userId` OR user has an `OrderAssignment` for that order.

### 3. Socket.IO Server Layer

```
Connection flow:
1. Client connects with auth.token
2. Server verifies JWT on connect → attach userId to socket.data
3. After auth, client joins room `order:{orderId}` per active order
4. Per-event auth: every sensitive event re-validates token + checks participation

Events:
  message:send   → validate → persist → broadcast message:new to room
  offer:create   → validate → persist → broadcast offer:new to room
  offer:accept   → validate → lock price → broadcast offer:accepted + order:updated
  typing:start   → broadcast typing:indicator to room (no persist)
  status:update  → validate FSM → persist → broadcast order:updated
  auth:renew     → re-verify token → update socket.data
```

**Room management:**
- Room name: `order:{orderId}`
- Client joins room on `join:order` event (after verifying participation)
- Client leaves room on `leave:order` event or disconnect
- On status transition to terminal → emit `order:updated`, remove all from room

### 4. Polling Fallback

For unstable connections, `GET /v1/orders/:id/poll?sinceSeq=N` returns:
- New messages with `seq > sinceSeq`
- New offers with `seq > sinceSeq`
- New status events with `seq > sinceSeq`

All in a single response, sorted by seq. Mobile polls every 10s when socket is disconnected.

### 5. Mobile Screens & Hooks

**New hooks:**
- `useMessages(orderId)` — infinite query, seq-paginated
- `useOffers(orderId)` — query
- `useSendMessage()` — mutation with optimistic update
- `useCreateOffer()` — mutation
- `useAcceptOffer()` — mutation with cache invalidation
- `usePoll(orderId, sinceSeq)` — conditional query when socket disconnected

**New screens:**
- `ChatScreen` — message list + input + typing indicator + offer cards inline
- `NegotiationBar` — price slider (floor→ceiling, step 5 MAD) + send offer button, shown in ChatScreen

**Updated screens:**
- `OrderDetailScreen` — add "Négocier" button when status=negotiating, show finalPrice when accepted
- `OrdersListScreen` — show finalPrice when available, add "negotiating" badge

**Socket integration:**
- `SocketContext` wrapping app, manages connect/disconnect lifecycle tied to AuthContext
- Socket events write directly to TanStack Query cache (no parallel state)
- On `message:new` → append to messages query cache
- On `offer:new` → append to offers query cache
- On `offer:accepted` → invalidate order query
- On `order:updated` → invalidate order + orders list queries

## Data Flow Diagram

```
Mobile                          API                         DB
  │                              │                           │
  ├─ message:send ──────────────►│                           │
  │  {orderId, content,          ├─ validate JWT + room ─────┤
  │   clientMessageId}           ├─ INSERT message ──────────┤
  │                              ├─ broadcast message:new ──►│
  │◄─ message:new ──────────────┤  (to room order:{id})     │
  │  {id, seq, content, sender}  │                           │
  │                              │                           │
  ├─ offer:create ──────────────►│                           │
  │  {orderId, amount}           ├─ validate floor/ceiling ──┤
  │                              ├─ reject prev pending ─────┤
  │                              ├─ INSERT offer ────────────┤
  │◄─ offer:new ────────────────┤                           │
  │                              │                           │
  ├─ offer:accept ──────────────►│                           │
  │  {orderId, offerId}          ├─ $transaction: ───────────┤
  │                              │  offer.status=accepted    │
  │                              │  order.finalPrice=amount  │
  │                              │  statusEvent neg→accepted │
  │◄─ offer:accepted ──────────┤                           │
  │◄─ order:updated ───────────┤                           │
```

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Socket disconnects | Mobile falls back to polling every 10s, reconnects automatically |
| Duplicate message (same clientMessageId) | Server returns existing message, no duplicate created |
| Offer amount < floor or > ceiling | 400 VALIDATION_ERROR with "Montant hors limites" |
| Offer amount not multiple of 5 | 400 VALIDATION_ERROR with "Montant doit être un multiple de 5" |
| Accept own offer | 403 FORBIDDEN "Vous ne pouvez pas accepter votre propre offre" |
| Non-participant tries to message | 403 FORBIDDEN "Accès non autorisé à cette commande" |
| Order not in negotiating status | 409 INVALID_STATE "La commande n'est pas en négociation" |
| JWT expired on socket | Emit `auth:expired`, client re-authenticates via `auth:renew` |

## Key Design Decisions

1. **Socket events write to TanStack Query cache** — No parallel Redux/Zustand state. Socket is a transport, not a state store.
2. **REST endpoints mirror socket events** — Every socket action has a REST fallback. Polling covers the read side.
3. **seq-based pagination, not timestamps** — Monotonic, gap-free, simpler cursor logic.
4. **Per-event auth on socket** — Not just on connect. Tokens can expire mid-session.
5. **clientMessageId for idempotency** — Socket reconnects may replay sends. UUID dedup prevents duplicates.
6. **Auto-reject previous pending offer** — At most one pending offer per user per order at any time.
