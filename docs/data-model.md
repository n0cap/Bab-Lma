# Babloo MVP — Data Model (Inferred Section 5)

## Entity Relationship Overview

```
┌──────────┐     ┌───────────────┐     ┌──────────────┐
│   User   │────<│     Order     │>────│ Professional │
└──────────┘     └───────┬───────┘     └──────────────┘
                         │
          ┌──────────────┼──────────────┐
          │              │              │
   ┌──────┴───┐   ┌─────┴─────┐  ┌────┴──────────┐
   │ Message  │   │ StatusEvent│  │NegotiationOffer│
   └──────────┘   └───────────┘  └───────────────┘
          │
   ┌──────┴──────────┐
   │ OrderAssignment  │  (1–5 pros per order)
   └─────────────────┘
```

## Tables

### User

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK, default gen_random_uuid() | |
| email | varchar(255) | unique, nullable | null for phone-only users |
| phone | varchar(20) | unique, nullable | E.164 format (+212...) |
| passwordHash | text | nullable | null for phone-only (OTP) users |
| fullName | varchar(100) | not null | |
| role | enum UserRole | not null | `client`, `pro`, `admin` |
| locale | enum Locale | not null, default `fr` | `fr`, `ar`, `en` |
| avatarUrl | text | nullable | |
| isActive | boolean | not null, default true | soft disable |
| createdAt | timestamptz | not null, default now() | |
| updatedAt | timestamptz | not null, auto-updated | |

Check: at least one of email or phone must be non-null.

### Professional

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| userId | uuid | FK → User, unique | one-to-one with User (role=pro) |
| skills | enum ServiceType[] | not null | `menage`, `cuisine`, `childcare` |
| bio | text | nullable | |
| rating | float | not null, default 0 | computed average from Rating |
| totalSessions | int | not null, default 0 | |
| reliability | float | not null, default 100 | % on-time |
| zones | varchar[] | not null | e.g. `["agdal","hay_riad"]` |
| isAvailable | boolean | not null, default true | |
| createdAt | timestamptz | not null | |
| updatedAt | timestamptz | not null | |

### Order

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| clientId | uuid | FK → User, not null | |
| serviceType | enum ServiceType | not null | `menage`, `cuisine`, `childcare` |
| status | enum OrderStatus | not null, default `draft` | lifecycle state |
| floorPrice | int | not null | computed at creation, immutable |
| finalPrice | int | nullable | set on offer acceptance, immutable after |
| tipAmount | int | not null, default 0 | separate from negotiated price |
| scheduledStartAt | timestamptz | nullable | null = ASAP |
| scheduledEndAt | timestamptz | nullable | derived from duration estimate |
| location | varchar(100) | not null | zone name |
| createdAt | timestamptz | not null | |
| updatedAt | timestamptz | not null | |

### OrderDetail

Polymorphic per service type. One-to-one with Order.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| orderId | uuid | FK → Order, unique | |
| surface | int | nullable | ménage: 20–1000 m² |
| cleanType | enum CleanType | nullable | `simple`, `deep` |
| teamType | enum TeamType | nullable | `solo`, `duo`, `squad` |
| squadSize | int | nullable | 3–5, only when teamType=squad |
| guests | int | nullable | cuisine: 1–20 |
| dishes | varchar(500) | nullable | cuisine: free text |
| children | int | nullable | childcare: 1–6 |
| hours | int | nullable | childcare: 1–12 |
| notes | varchar(500) | nullable | allergies, meds, instructions |

### OrderAssignment

Supports solo (1 row), duo (2 rows), squad (3–5 rows) per order.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| orderId | uuid | FK → Order | |
| professionalId | uuid | FK → Professional | |
| isLead | boolean | not null, default false | one lead per order |
| status | enum AssignmentStatus | not null | `assigned`, `confirmed`, `declined` |
| assignedAt | timestamptz | not null | |
| confirmedAt | timestamptz | nullable | |

Unique index: `(orderId, professionalId)`.

### StatusEvent

Append-only audit log of order state transitions.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| orderId | uuid | FK → Order | |
| seq | bigserial | not null, unique | monotonic for polling |
| fromStatus | enum OrderStatus | not null | |
| toStatus | enum OrderStatus | not null | |
| actorUserId | uuid | FK → User | |
| actorRole | enum ActorRole | not null | `client`, `pro`, `admin`, `system` |
| reason | varchar(500) | nullable | for cancellations/overrides |
| createdAt | timestamptz | not null | |

### Message

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| orderId | uuid | FK → Order | room = order |
| seq | bigserial | not null | monotonic for polling |
| senderId | uuid | FK → User | |
| senderRole | enum ActorRole | not null | `client`, `pro`, `system` |
| content | varchar(2000) | not null | trimmed, HTML stripped |
| clientMessageId | uuid | nullable, unique | deduplication key from client |
| createdAt | timestamptz | not null | |

Index: `(orderId, seq)` for cursor-based pagination.

### NegotiationOffer

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| orderId | uuid | FK → Order | |
| seq | bigserial | not null | monotonic for polling |
| offeredBy | uuid | FK → User | |
| amount | int | not null | must be ≥ floor, ≤ ceiling, multiple of 5 |
| status | enum OfferStatus | not null, default `pending` | `pending`, `accepted`, `rejected` |
| acceptedAt | timestamptz | nullable | |
| createdAt | timestamptz | not null | |

Unique partial index: `(orderId) WHERE status = 'accepted'` — enforces at most one accepted offer per order.

### OtpChallenge

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| phone | varchar(20) | not null | E.164 normalized |
| purpose | enum OtpPurpose | not null | `login`, `signup`, `reset` |
| codeHash | text | not null | bcrypt-hashed 6-digit code |
| expiresAt | timestamptz | not null | +5 min from creation |
| attempts | int | not null, default 0 | max 5 |
| consumedAt | timestamptz | nullable | null until verified |
| createdAt | timestamptz | not null | |

Rate limit: max 3 challenges per phone per 15 minutes (enforced at API layer).

### RefreshToken

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| userId | uuid | FK → User | |
| tokenHash | varchar(64) | unique, not null | sha256 hex, indexed |
| family | uuid | not null | rotation family |
| replacedBy | uuid | FK → self, nullable | chain for reuse detection |
| isRevoked | boolean | not null, default false | |
| expiresAt | timestamptz | not null | +30 days |
| createdAt | timestamptz | not null | |

Index: `(tokenHash)` for fast lookup. Index: `(family)` for bulk revocation.

Reuse detection: if a revoked token is presented, revoke ALL tokens in the same family.

### Rating

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| orderId | uuid | FK → Order, unique | one rating per order |
| clientId | uuid | FK → User | |
| stars | int | not null | 1–5 |
| comment | varchar(1000) | nullable | trimmed |
| createdAt | timestamptz | not null | |

### AuditLog

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| action | varchar(100) | not null | e.g. `price_lock`, `admin_override`, `account_suspend` |
| entityType | varchar(50) | not null | `order`, `user`, `negotiation` |
| entityId | uuid | not null | |
| actorUserId | uuid | FK → User | |
| actorRole | enum ActorRole | not null | |
| metadata | jsonb | nullable | flexible payload |
| createdAt | timestamptz | not null | |

Index: `(entityType, entityId)` for lookup. Index: `(actorUserId)` for per-user audit.

### IdempotencyKey

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| key | varchar(64) | not null | client-provided |
| userId | uuid | FK → User | |
| response | jsonb | not null | stored response body |
| statusCode | int | not null | stored HTTP status |
| createdAt | timestamptz | not null | |

Unique index: `(key, userId)`. TTL: 24 hours (cron or DB-level cleanup).

## Enums

```
UserRole      = client | pro | admin
Locale        = fr | ar | en
ServiceType   = menage | cuisine | childcare
OrderStatus   = draft | submitted | searching | negotiating | accepted | en_route | in_progress | completed | cancelled
CleanType     = simple | deep
TeamType      = solo | duo | squad
AssignmentStatus = assigned | confirmed | declined
OfferStatus   = pending | accepted | rejected
OtpPurpose    = login | signup | reset
ActorRole     = client | pro | admin | system
```

## Status Lifecycle FSM

```
draft → submitted → searching → negotiating → accepted → en_route → in_progress → completed
                                                                                   ↗
Any non-terminal state ──────────────────────────────────────────────────→ cancelled
```

Terminal states: `completed`, `cancelled`.

Valid transitions enforced by shared FSM in `packages/shared`. Each transition creates a StatusEvent row with actor, timestamp, and optional reason.

Prototype view mapping: `accepted/en_route/in_progress → en_cours`, `completed → terminee`.
