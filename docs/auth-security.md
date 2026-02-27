# Babloo MVP — Auth & Security (Inferred Section 6)

## Authentication Flows

### Email + Password

```
Client                            API
  │── POST /v1/auth/signup ─────>│ validate, bcrypt(password, 12), create User
  │   {email, password, name}    │ create RefreshToken (sha256, family)
  │<── 201 {accessToken,         │ return JWT + refresh
  │         refreshToken}        │
  │                              │
  │── POST /v1/auth/login ──────>│ find by email, bcrypt.compare
  │   {email, password}          │ generic 401 on any failure (no enumeration)
  │<── 200 {accessToken,         │
  │         refreshToken}        │
```

### Phone + OTP

```
Client                            API
  │── POST /v1/auth/otp/request ─>│ normalize phone to E.164
  │   {phone, purpose}            │ rate-limit: 3 per phone per 15min
  │                               │ generate 6-digit code
  │<── 200 {challengeId}          │ store bcrypt(code) in OtpChallenge
  │                               │ send SMS (mock in dev: code=123456)
  │                               │
  │── POST /v1/auth/otp/verify ──>│ ATOMIC TRANSACTION:
  │   {challengeId, code}         │   1. find challenge WHERE consumedAt IS NULL
  │                               │      AND attempts < 5 AND expiresAt > now()
  │<── 200 {accessToken,          │   2. increment attempts
  │         refreshToken}         │   3. bcrypt.compare(code, codeHash)
  │                               │   4. if match: set consumedAt, find/create User
  │                               │   5. issue tokens
  │                               │ Generic 401 on any failure
```

### Token Refresh with Reuse Detection

```
Client                            API
  │── POST /v1/auth/refresh ────>│ sha256(token) → lookup by tokenHash
  │   {refreshToken}             │
  │                              │ IF isRevoked:
  │                              │   → COMPROMISE: revoke ALL in family
  │                              │   → 401
  │                              │
  │                              │ IF expired:
  │                              │   → 401
  │                              │
  │                              │ IF valid:
  │<── 200 {accessToken,         │   → mark current as revoked
  │         newRefreshToken}     │   → set replacedBy → new token ID
  │                              │   → create new RefreshToken (same family)
  │                              │   → issue new JWT
```

### Logout

```
POST /v1/auth/logout      (JWT required) → revoke current token family
POST /v1/auth/logout-all  (JWT required) → revoke ALL user refresh tokens
```

## Token Strategy

| Token | TTL | Storage (mobile) | Format |
|-------|-----|-------------------|--------|
| Access | 15 min | Memory only (AuthContext) | JWT HS256 `{userId, role, locale}` |
| Refresh | 30 days | expo-secure-store | random 64-byte hex |

- Access token: signed with `JWT_SECRET` env var, never persisted to disk
- Refresh token: stored as `sha256(token)` in DB (indexed for fast lookup)
- Token family: UUID assigned at login, preserved across rotations

## Auth Bootstrap (App Start)

```
App launches
  → show splash screen (Babloo logo animation)
  → read refreshToken from SecureStore
  → IF exists: POST /v1/auth/refresh
    → success: hydrate AuthContext, render MainTabs
    → failure: clear SecureStore, render AuthStack
  → IF absent: render AuthStack
```

No flicker between auth states. Splash covers the bootstrap check.

## OTP Security

| Rule | Value |
|------|-------|
| Code length | 6 digits |
| TTL | 5 minutes |
| Max attempts per challenge | 5 |
| Rate limit | 3 challenges per phone per 15 min |
| Storage | bcrypt-hashed (never plaintext) |
| Verification | atomic transaction (prevents race/double-use) |
| Dev bypass | code `123456` when `NODE_ENV=development` |
| SMS provider | interface abstraction, Twilio adapter (mock in MVP) |

## API Security Middleware Stack

```
Request
  │
  ├─ 1. Rate limiter (express-rate-limit)
  │     Global: 100 req/min per IP
  │     Auth endpoints: 10 req/min per IP
  │     OTP request: 3 req/15min per phone
  │
  ├─ 2. CORS (origin whitelist)
  │
  ├─ 3. Helmet (security headers)
  │
  ├─ 4. Auth middleware (JWT verify)
  │     Explicit public route allowlist:
  │       /v1/auth/signup
  │       /v1/auth/login
  │       /v1/auth/otp/request
  │       /v1/auth/otp/verify
  │       /v1/auth/refresh
  │       /v1/pricing/estimate
  │     All other routes require valid JWT
  │
  ├─ 5. Role guard (per-route)
  │     requireRole('client') / requireRole('pro') / requireRole('admin')
  │
  ├─ 6. Zod validation (body, params, query)
  │     Shared schemas from packages/shared
  │
  ├─ 7. Idempotency middleware (POST routes)
  │     Check IdempotencyKey table, return stored response if duplicate
  │
  └─ 8. Route handler
```

## Authorization Matrix

| Resource | Client | Pro | Admin |
|----------|--------|-----|-------|
| Create order | own only | — | — |
| View order | own orders | assigned orders | all |
| Cancel order | own, pre-terminal | assigned, with reason | all + audit |
| Send message | in own order | in assigned order | — |
| Make offer | in own order | in assigned order | — |
| Accept offer | cross-party only | cross-party only | — |
| Update status | — | assigned, valid FSM transition | any + audit |
| Override price | — | — | yes + audit log |
| View users | — | — | all |
| Suspend user | — | — | yes + audit log |

## Socket.IO Security

### Connection Auth

```
Client: io(url, { auth: { token: accessToken } })
Server middleware:
  1. Verify JWT
  2. Attach userId + role to socket
  3. On failure: disconnect immediately
```

### Room Subscription

```
Client: emit subscribe:order { orderId }
Server:
  1. Verify user is participant (client owns order OR pro in OrderAssignment)
  2. Join room order:{orderId}
  3. On failure: emit error, do not join
```

### Per-Event Auth (on every sensitive event)

```
validateSocketEvent(socket, orderId, requiredRole?):
  1. Verify JWT not expired
  2. Verify user is participant in this order
  3. Verify role allowed for this action
  4. On failure: emit error, block processing
```

### Token Expiry Handling

```
Server detects expired token on event:
  → emit auth:expired
  → block all writes from this socket

Client receives auth:expired:
  → call /v1/auth/refresh
  → emit auth:renew { token: newAccessToken }
  → server re-validates, unblocks writes
  → re-subscribe rooms

Writes queued (not dropped) during re-auth window.
If re-auth fails → force logout.
```

### Reconnect Flow

```
Socket.IO reconnect event:
  1. Get current accessToken from AuthContext
  2. If expired → refresh first
  3. Emit auth:renew { token }
  4. Wait for server ack
  5. Re-subscribe all active order rooms
  6. Unblock writes only after ack
```

## Password Policy

- Minimum 8 characters
- Validated client-side (zod) + server-side
- Stored as bcrypt hash (cost factor 12)
- No password required for phone-only users (passwordHash nullable)

## Error Response Policy

All auth failures return identical generic responses to prevent enumeration:

```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Identifiants invalides"
  }
}
```

No distinction between "user not found", "wrong password", "wrong OTP", "expired OTP" in the HTTP response.

## Idempotency

Required on these endpoints:

| Endpoint | Key Scope |
|----------|-----------|
| POST /v1/orders | per user intent (generated on confirm tap) |
| POST /v1/orders/:id/offers | per user intent |
| POST /v1/orders/:id/offers/:offerId/accept | per user intent |
| POST /v1/orders/:id/cancel | per user intent |
| POST /v1/orders/:id/rating | per user intent |

Key is stable across retries for the same action. Stored in `IdempotencyKey` table with 24h TTL. On duplicate: return stored response without re-executing.

Socket messages deduplicated via `clientMessageId` (UUID generated client-side).

## Validation Limits

| Field | Constraint |
|-------|-----------|
| Message content | 1–2000 chars, trimmed, HTML stripped |
| Offer amount | ≥ floorPrice, ≤ ceiling, multiple of 5, integer |
| Cancel reason | 0–500 chars, trimmed |
| Rating comment | 0–1000 chars, trimmed |
| Rating stars | integer 1–5 |
| fullName | 1–100 chars |
| Dishes description | 0–500 chars |
| Childcare notes | 0–500 chars |
| Maid notes | 0–500 chars |
| Password | ≥ 8 chars |
| Phone | E.164 format, Moroccan (+212...) |
| Email | standard format validation |

All validation enforced via shared zod schemas (client + server).

## Sensitive Data Handling

| Data | Treatment |
|------|-----------|
| Passwords | bcrypt (cost 12), never logged |
| OTP codes | bcrypt-hashed, never stored plaintext |
| Refresh tokens | sha256-hashed in DB |
| Phone numbers | stored as-is (needed for SMS), not exposed in public list responses |
| JWT secret | env var `JWT_SECRET`, never committed |
| DB credentials | env vars via Railway, never committed |
| `.env` files | in `.gitignore` |
