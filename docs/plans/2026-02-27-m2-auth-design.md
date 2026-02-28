# M2: Auth + Mobile Auth — Design Document

## Scope

Code-only M2: full auth backend, mobile auth screens + AuthContext, tests.
Railway deploy is a separate infra task (not in scope).

## Section 1: API Auth Backend

### Existing assets
- Express scaffold with health endpoint (`apps/api/src/index.ts`)
- Prisma schema: User, RefreshToken, OtpChallenge (+ all 13 tables)
- Shared Zod schemas: signupSchema, loginSchema, otpRequestSchema, otpVerifySchema, refreshSchema, updateProfileSchema
- Config: JWT secret/TTLs, bcrypt rounds, OTP settings, rate-limit values

### New files

| File | Purpose |
|------|---------|
| `src/db.ts` | Singleton PrismaClient instance |
| `src/utils/jwt.ts` | sign/verify access tokens (HS256), generate 64-byte hex refresh token |
| `src/services/auth.service.ts` | All auth business logic: signup, login, OTP request/verify, refresh (with reuse detection), logout, logout-all |
| `src/routes/auth.routes.ts` | 7 endpoints: signup, login, otp/request, otp/verify, refresh, logout, logout-all |
| `src/routes/user.routes.ts` | GET /v1/users/me, PATCH /v1/users/me |
| `src/middleware/auth.middleware.ts` | JWT verify, attach `req.user`, public route allowlist |
| `src/middleware/role.guard.ts` | `requireRole('client' \| 'pro' \| 'admin')` |
| `src/middleware/validate.ts` | Zod schema validation middleware |
| `src/middleware/error.handler.ts` | Centralized error-to-JSON response |

### Key design decisions

1. **Service-layer pattern:** Routes are thin (validate -> call service -> respond). All business logic in auth.service.ts.
2. **OTP throttle — dual layer:**
   - DB-backed count query in auth.service.ts is the authoritative gate (3 per phone per 15min)
   - Middleware rate-limiter is coarse IP-level edge protection only
3. **Refresh token security:**
   - Raw token only sent to client, never stored
   - DB stores `sha256(rawToken)` in `tokenHash` column
   - Lookups always by hash
   - Reuse detection: if revoked token presented, revoke ALL tokens in same family
4. **Generic error responses:** All auth failures return identical `INVALID_CREDENTIALS` to prevent enumeration.
5. **Auth rate limiting:** 10 req/min per IP on auth endpoints (middleware). OTP: 3 per phone per 15min (DB-backed).

## Section 2: Mobile Auth

### Existing assets
- AuthEntryScreen placeholder, RootNavigator with hardcoded `IS_AUTHENTICATED = false`
- api.ts with axios instance, theme/i18n/navigation scaffolding
- expo-secure-store in dependencies

### New files

| File | Purpose |
|------|---------|
| `src/contexts/AuthContext.tsx` | Holds accessToken (memory only), user object. Provides signIn, signUp, signOut, refreshToken. Wraps axios interceptor for auto-attach + 401 refresh retry. |
| `src/services/secureStore.ts` | Thin wrapper around expo-secure-store for refresh token persistence |
| `src/services/mutations/auth.ts` | TanStack useMutation hooks: useSignup, useLogin, useOtpRequest, useOtpVerify, useLogout |
| `src/services/queries/user.ts` | useMe() — GET /v1/users/me |
| `src/screens/auth/SignInEmailScreen.tsx` | Email + password sign-in form |
| `src/screens/auth/SignInPhoneScreen.tsx` | Phone number entry -> OTP |
| `src/screens/auth/SignUpEmailScreen.tsx` | Email + password + name registration |
| `src/screens/auth/SignUpPhoneScreen.tsx` | Phone + name registration -> OTP |
| `src/screens/auth/OtpScreen.tsx` | 6-digit code entry, timer, resend |
| `src/screens/auth/ForgotPasswordScreen.tsx` | Placeholder for password reset |

### Key design decisions

1. **Refresh mutex:** Single in-flight refresh promise in AuthContext. Multiple concurrent 401 interceptors await the same promise — no refresh storms.
2. **Auth bootstrap:** App.tsx splash -> read SecureStore -> try refresh -> hydrate AuthContext or clear and show AuthStack. No flicker.
3. **RootNavigator:** Replace `IS_AUTHENTICATED` constant with `AuthContext.isAuthenticated`.
4. **Screen flow:** AuthEntryScreen presents email/phone choice. Email -> SignIn/SignUp. Phone -> SignIn/SignUp -> OtpScreen.
5. **French-first:** All labels, errors, placeholders from i18n/fr.json.

## Section 3: Testing Strategy

### API tests (`apps/api/src/__tests__/`)

**auth.service.test.ts** — Unit tests with mocked Prisma:
- Signup: email+password, phone-only, duplicate rejection
- Login: success, wrong password, nonexistent user (generic error)
- OTP: request, verify, consumed challenge rejection, max attempts, DB-backed throttle
- Refresh: rotation success, reuse detection (revoke family), expired token
- Logout: single family revocation, logout-all

**auth.routes.test.ts** — Integration tests via supertest:
- Validation rejection (bad payloads via shared Zod schemas)
- Public vs protected route enforcement
- Generic error responses (no enumeration leaks)
- Rate limiting behavior

### Mobile
- Typecheck only (tsc --noEmit). No Jest/RN test runner in M2 scope.

### Shared
- Existing 55 tests cover validation schemas. No new shared tests needed.

## Acceptance Criteria

### Must pass
1. `pnpm --filter @babloo/api test` — all auth service + route tests green
2. `pnpm --filter @babloo/api exec tsc --noEmit` — API typecheck clean
3. `pnpm --filter @babloo/mobile exec tsc --noEmit` — mobile typecheck clean
4. `pnpm --filter @babloo/shared test` — existing 55 tests still green

### Functional (requires Postgres)
5. Signup via email+password creates user, returns JWT + refresh token
6. Login returns valid JWT, refresh token stored as sha256 hash
7. OTP request creates challenge with bcrypt-hashed code
8. OTP verify consumes challenge, issues tokens
9. OTP throttle rejects 4th request within 15min for same phone
10. Refresh rotates token, reuse of old token revokes family
11. Logout revokes current family; logout-all revokes all user tokens
12. GET /v1/users/me returns profile; PATCH updates it
13. Protected routes reject missing/invalid/expired JWT

### Mobile (requires simulator)
14. App boots, shows splash, checks SecureStore, renders AuthStack
15. Sign-in/sign-up forms submit to API, store tokens, navigate to MainTabs
16. 401 triggers silent refresh; failed refresh redirects to AuthStack
