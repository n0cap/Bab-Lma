# M6: Polish + Builds — Design Document

## Goal

Ship-ready MVP: accessibility audit, French error consolidation, ProfileScreen + HomeScreen polish, critical-path E2E tests with real Postgres, and EAS build config.

## Scope

### 1. ProfileScreen

Replace the current stub with a functional settings screen.

**Display:** full name (editable), phone (editable), email (read-only gray text).
**Actions:** inline edit with save button (PATCH `/v1/users/me` via `useUpdateProfile`), logout button at bottom (calls `signOut` from AuthContext).
**Data:** `useMe()` query (existing), `updateProfileSchema` (existing, accepts `fullName` and `locale`).

Phone editing is display-only for now — the `updateProfileSchema` doesn't accept phone changes (would need OTP re-verification). Show phone as read-only alongside email.

### 2. HomeScreen Polish

Keep existing service quick-cards grid + "Réserver un service" CTA.

Add a "Commandes récentes" section between the CTA and the grid showing the last 3 active (non-terminal) orders as compact cards. Tapping navigates to `OrderDetail`. Uses existing `useOrders` data — no new API call. Section hidden when no active orders.

### 3. Accessibility Audit

Add `accessibilityLabel`, `accessibilityRole`, `accessibilityHint` to all interactive elements across all screens. Audit scope:

- All `TouchableOpacity` elements: add `accessibilityRole="button"` + descriptive label
- All `TextInput` elements: add `accessibilityLabel` matching placeholder/label
- Star pickers (RatingScreen, OrderDetailScreen): add `accessibilityValue` with current/min/max
- Tab bars (OrdersListScreen): add `accessibilityState={{ selected }}` + `accessibilityRole="tab"`
- Status badges: add `accessibilityLabel` with status text
- Back buttons: consistent `accessibilityLabel="Retour"`
- Touch targets: ensure ≥ 44×44px on all interactive elements (pad where needed)

No color changes needed — navy/white already passes WCAG AA.

### 4. French Error String Consolidation

Create `apps/api/src/constants/errors.ts` with centralized French error message constants. Replace all inline French strings in services and routes with constant references.

Constants organized by domain: `AUTH_ERRORS`, `ORDER_ERRORS`, `NEGOTIATION_ERRORS`, `ADMIN_ERRORS`, `COMMON_ERRORS`.

On mobile, add missing i18n keys for: profile section labels, validation error messages, network/server error fallbacks.

### 5. API E2E Critical-Path Test

One test file covering the full user journey: signup → create order → send message → create offer → accept offer → advance status (accepted → en_route → in_progress → completed) → submit rating → verify pro stats updated.

**Test DB architecture:**
- **testcontainers** spins up an ephemeral Postgres container per suite
- `globalSetup.e2e.ts`: start container → set `DATABASE_URL` env → run `prisma migrate deploy`
- `globalTeardown.e2e.ts`: stop container
- `beforeEach`: truncate all tables (fast reset, no re-migrate)
- Separate vitest config: `vitest.e2e.config.ts` with `include: ['src/__tests__/e2e/**/*.test.ts']`
- New npm script: `test:e2e` runs the E2E config
- Uses supertest against the real Express app (imported from `app.ts`), real Prisma client pointed at the ephemeral DB

**Test actors:** client user (email signup), pro user (email signup, manually set role to 'pro' via Prisma), admin user (for status override verification).

**Key assertions:** order status transitions follow FSM, rating updates pro weighted average, offers lock `finalPrice`, status events are created at each transition.

### 6. EAS Build Config

- `eas.json`: three profiles — development (internal distribution, debug), preview (internal, release), production (store, release)
- `app.json` updates: `name: "Babloo"`, `slug: "babloo"`, `scheme: "babloo"`, `ios.bundleIdentifier: "com.babloo.app"`, `android.package: "com.babloo.app"`, splash `backgroundColor: "#EDEEF6"` (theme bg color)
- No credential/signing setup — user handles that separately

## Out of Scope

- Avatar upload (needs S3/Cloudinary)
- Arabic/English translations
- Push notifications
- Payment integration
- Detox mobile E2E tests
- Phone number editing (needs OTP re-verification flow)
