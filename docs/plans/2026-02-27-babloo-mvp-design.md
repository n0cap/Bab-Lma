# Babloo MVP — Design Document

## Overview

Babloo is a Moroccan on-demand home services marketplace (ménage, cuisine, childcare). This document captures the validated design for the hosted MVP: Expo React Native + TypeScript mobile app, Express + Socket.IO API, PostgreSQL + Prisma, deployed on Railway.

## System Architecture

```
┌──────────────────────────────────────────────────┐
│                 Railway (Hosted)                  │
│  ┌─────────────────────┐  ┌────────────────────┐ │
│  │  apps/api (Express)  │──│  Railway Postgres   │ │
│  │  REST + Socket.IO    │  │  Prisma ORM         │ │
│  └──────────┬───────────┘  └────────────────────┘ │
└─────────────┼────────────────────────────────────┘
              │ HTTPS + WSS
┌─────────────┼────────────────────────────────────┐
│  apps/mobile (Expo RN + TypeScript)               │
│  iOS (TestFlight) + Android (Internal Testing)    │
└──────────────────────────────────────────────────┘
              │ shared types/validation
┌──────────────────────────────────────────────────┐
│  packages/shared                                  │
│  Types, Pricing engine, Zod schemas, FSM, i18n    │
└──────────────────────────────────────────────────┘
```

### Monorepo Layout

```
babloo/
├── apps/
│   ├── api/              # Express + Socket.IO + Prisma
│   │   ├── src/
│   │   │   ├── routes/   # auth, orders, pricing, chat, admin
│   │   │   ├── services/ # business logic
│   │   │   ├── socket/   # real-time handlers
│   │   │   ├── middleware/# auth, validation, error, rate-limit, idempotency
│   │   │   └── index.ts
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── seed.ts
│   │   └── Dockerfile
│   └── mobile/           # Expo React Native
│       ├── src/
│       │   ├── screens/
│       │   ├── components/
│       │   ├── navigation/
│       │   ├── hooks/
│       │   ├── services/
│       │   │   ├── api.ts
│       │   │   ├── queries/
│       │   │   ├── mutations/
│       │   │   └── socket.ts
│       │   ├── contexts/  # AuthContext, SocketContext, OrderFlowContext
│       │   ├── i18n/
│       │   └── theme/
│       └── app.json
├── packages/
│   └── shared/
├── pnpm-workspace.yaml
├── .env.example
└── README.md
```

## Key Architecture Decisions

1. **Express + Socket.IO** — Battle-tested, built-in reconnection/rooms/long-polling fallback.
2. **pnpm monorepo** — Shared pricing engine runs identically on client (instant estimates) and server (authoritative validation).
3. **JWT access (15min) + refresh (30d)** — Stateless access, sha256-hashed refresh tokens with family-based reuse detection.
4. **TanStack Query** — Single data-fetch layer. Socket events write directly to query cache. No parallel state.
5. **OrderFlowContext for draft only** — Canonical order/message/offer state lives in server + TanStack Query cache.

## Navigation

```
RootNavigator
├─ AuthStack (no token)
│   ├─ AuthEntryScreen
│   ├─ SignInEmailScreen / SignInPhoneScreen
│   ├─ SignUpEmailScreen / SignUpPhoneScreen
│   ├─ OtpScreen
│   └─ ForgotPasswordScreen
├─ MainTabs (authenticated)
│   ├─ HomeTab → HomeScreen
│   ├─ OrdersTab → OrdersListScreen, OrderDetailScreen
│   ├─ LoyaltyTab (placeholder)
│   └─ SettingsTab → ProfileScreen
└─ OrderFlowStack (modal)
    ├─ BookingMaidScreen
    ├─ BookingCuisineScreen
    ├─ BookingChildcareScreen
    ├─ ConfirmScreen
    ├─ SearchScreen
    ├─ ChatScreen
    ├─ OrderConfirmedScreen
    ├─ StatusScreen
    └─ RatingScreen
```

## Design System

**Colors:** navy `#0E1442`, clay `#C4370D`, bg `#EDEEF6`, surface `#FFFFFF`, text-sec `#5C5C7A`, success `#1A7A50`, warning `#B06B00`, error `#C0392B`

**Typography:** Fraunces (serif) for headlines/prices; DM Sans for UI/body.

**Components:** Button (primary/clay/outline/ghost/xs), Card, Chip (navy/success/clay/warn), Input, Stepper, Toggle, Avatar, BackHeader, BottomSheet, Toast, StatusTimeline, PriceSlider, ChatBubble, ServiceCard, StarRating, EmptyState, LoadingState, ErrorState.

## API Design

All routes prefixed `/v1/`. Paginated responses use cursor-based pagination with `(createdAt, id)` composite sort key. Mutating POSTs require `Idempotency-Key` header. Generic error responses to prevent enumeration.

See `docs/auth-security.md` for auth endpoints and security details.
See `docs/data-model.md` for full schema.

### Core Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/v1/auth/signup` | — | create account |
| POST | `/v1/auth/login` | — | email login |
| POST | `/v1/auth/otp/request` | — | send OTP |
| POST | `/v1/auth/otp/verify` | — | verify OTP |
| POST | `/v1/auth/refresh` | — | rotate tokens |
| POST | `/v1/auth/logout` | JWT | revoke family |
| POST | `/v1/auth/logout-all` | JWT | revoke all |
| GET | `/v1/users/me` | JWT | profile |
| PATCH | `/v1/users/me` | JWT | update profile |
| POST | `/v1/pricing/estimate` | — | compute price |
| POST | `/v1/orders` | client | create order |
| GET | `/v1/orders` | JWT | list own orders |
| GET | `/v1/orders/:id` | JWT | order detail |
| POST | `/v1/orders/:id/cancel` | JWT | cancel order |
| PATCH | `/v1/orders/:id/status` | pro | update status |
| GET | `/v1/orders/:id/messages` | JWT | chat history |
| GET | `/v1/orders/:id/offers` | JWT | offer list |
| POST | `/v1/orders/:id/offers` | JWT | create offer |
| POST | `/v1/orders/:id/offers/:offerId/accept` | JWT | accept offer |
| POST | `/v1/orders/:id/rating` | client | rate order |
| GET | `/v1/orders/:id/poll` | JWT | fallback poll |
| PATCH | `/v1/admin/orders/:id/status` | admin | override status |
| PATCH | `/v1/admin/orders/:id/price` | admin | override price |
| PATCH | `/v1/admin/users/:id` | admin | suspend/activate |
| GET | `/v1/admin/audit-log` | admin | audit trail |

### Socket.IO Events

| Event | Direction | Purpose |
|-------|-----------|---------|
| `message:send` | client→server | send chat message |
| `message:new` | server→client | new message broadcast |
| `typing:start` | client→server | typing indicator |
| `typing:indicator` | server→client | typing broadcast |
| `offer:create` | client→server | create price offer |
| `offer:new` | server→client | new offer broadcast |
| `offer:accept` | client→server | accept offer |
| `offer:accepted` | server→client | price locked broadcast |
| `status:update` | client→server | pro updates status |
| `order:updated` | server→client | status change broadcast |
| `auth:expired` | server→client | token failed |
| `auth:renew` | client→server | re-authenticate |

Per-event auth validation on every sensitive event, not just on connect.

### Conventions

- Timestamps: ISO 8601 UTC
- IDs: UUID v4
- Prices: integers in MAD
- Phones: E.164 normalized
- Polling: sinceSeq monotonic cursor (not timestamp)

## Pricing Engine

Shared in `packages/shared`, pure functions, no side effects.

### Ménage

Surface-based floor with team variant:

| Surface | Solo | Duo | Squad |
|---------|------|-----|-------|
| ≤40m² | 80 | — | — |
| ≤70m² | 100 | 140 | — |
| ≤110m² | 130 | 170 | — |
| ≤160m² | 170 | 210 | 270 |
| ≤220m² | 210 | 260 | 320 |
| ≤300m² | 260 | 320 | 400 |
| >300m² | +35/50m² | +45/50m² | +55/50m² |

Deep clean: `price = round(base * 1.35)`.
Squad minimum pay: `max(surface_price, squadSize * 100)`.

### Cuisine

| Guests | Price |
|--------|-------|
| ≤4 | 100 |
| ≤7 | 130 |
| ≤10 | 165 |
| >10 | 165 + ceil((guests-10)/3)*25 |

### Childcare

`price = children * 80 + children * max(0, hours - 2) * 25`

### Negotiation Bounds

- Floor = computed price (including squad minimum)
- Ceiling = round(floor * 2.5)
- Increment: 5 MAD
- Final price must be ≥ floor

## Milestones

```
M1: Foundation          (scaffold, schema, design system, nav shell)
M2: Auth + First Deploy (full auth, Railway live, mobile→hosted API)
M3: Booking + Pricing   (service config, pricing engine, order creation)
M4a: Negotiation (REST) (offers, chat via REST, price lock transaction)
M4b: Real-time Layer    (Socket.IO, live chat, polling fallback)
M5: Order Lifecycle     (status tracking, cancel, rating, history)
M6: Polish + Builds     (a11y, French copy, tests, TestFlight/Play)
                         ↳ stretch: ar/en translations
```

### Feature-Parity Checklist

```
[ ] Accounts: signup, signin, signout, profile
[ ] Create order: choose service, enter details, submit
[ ] Pricing engine: compute floor price from parameters
[ ] Negotiation: chat, price slider, lock final price
[ ] Order lifecycle: status updates, timeline, history
[ ] Real-time: chat messages, offers, status via socket
[ ] Polling fallback: sinceSeq-based, 10s interval
[ ] French-first UX: all copy, validation, errors in French
[ ] Accessibility: labels, focus, contrast, touch targets
[ ] Tests: unit + integration + E2E critical path
[ ] Hosted: API + DB on Railway, reachable via HTTPS
[ ] Installable builds: TestFlight + Play Internal Testing
```
