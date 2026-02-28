# M6: Polish + Builds — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ship-ready MVP with accessibility, French error consolidation, polished screens, E2E tests on real Postgres, and EAS build config.

**Architecture:** Six independent workstreams. API error constants and E2E tests are backend-only. ProfileScreen, HomeScreen, a11y, and i18n are mobile-only. EAS config is project-root. No cross-workstream dependencies except i18n keys used by ProfileScreen/HomeScreen.

**Tech Stack:** Express, Prisma, vitest, supertest, testcontainers (Docker Postgres), Expo, React Native, TanStack Query, EAS CLI.

---

### Task 1: French error constants

**Files:**
- Create: `apps/api/src/constants/errors.ts`
- Modify: `apps/api/src/services/auth.service.ts`
- Modify: `apps/api/src/services/order.service.ts`
- Modify: `apps/api/src/services/negotiation.service.ts`
- Modify: `apps/api/src/services/admin.service.ts`
- Modify: `apps/api/src/middleware/error.handler.ts`

**Steps:**

1. Create `apps/api/src/constants/errors.ts` with all French error messages currently hardcoded in services:

```typescript
export const AUTH = {
  DUPLICATE_EMAIL: 'Un compte avec cet email existe déjà',
  DUPLICATE_PHONE: 'Un compte avec ce numéro existe déjà',
  INVALID_CREDENTIALS: 'Identifiants invalides',
  OTP_RATE_LIMIT: 'Trop de demandes. Réessayez dans quelques minutes.',
} as const;

export const ORDER = {
  NOT_FOUND: 'Commande non trouvée',
  UNKNOWN_SERVICE: 'Type de service inconnu',
  INVALID_TRANSITION: 'Transition de statut invalide',
  ALREADY_CANCELLED: 'La commande est déjà annulée',
  CANNOT_CANCEL: 'Impossible d\'annuler cette commande',
  NOT_COMPLETED: 'La commande n\'est pas terminée',
  ALREADY_RATED: 'Vous avez déjà évalué cette commande',
  FORBIDDEN: 'Accès interdit',
} as const;

export const NEGOTIATION = {
  NOT_PARTICIPANT: 'Vous n\'êtes pas participant à cette commande',
  OFFER_NOT_FOUND: 'Offre non trouvée',
  OFFER_ALREADY_ACCEPTED: 'Une offre a déjà été acceptée',
  PRICE_BELOW_FLOOR: 'Le prix doit être supérieur ou égal au prix plancher',
  PRICE_ABOVE_CEILING: 'Le prix doit être inférieur ou égal au plafond',
} as const;

export const ADMIN = {
  FORBIDDEN: 'Accès réservé aux administrateurs',
  USER_NOT_FOUND: 'Utilisateur non trouvé',
} as const;

export const COMMON = {
  NOT_FOUND: 'Ressource non trouvée',
  VALIDATION_ERROR: 'Données invalides',
  INTERNAL_ERROR: 'Erreur interne du serveur',
} as const;
```

2. Replace all inline French strings in each service file with the corresponding constant import. For example in `auth.service.ts`:
   - `'Un compte avec cet email existe déjà'` → `AUTH.DUPLICATE_EMAIL`
   - `'Identifiants invalides'` → `AUTH.INVALID_CREDENTIALS`
   - etc.

3. Update `error.handler.ts` to use `COMMON.VALIDATION_ERROR` and `COMMON.INTERNAL_ERROR`.

**Validation gate:** `pnpm --filter @babloo/api exec tsc --noEmit` + `pnpm --filter @babloo/api exec vitest run` (all 80 existing tests must still pass — messages unchanged, only source of truth moved)

**Commit:** `refactor(api): centralize French error messages into constants`

---

### Task 2: Mobile i18n additions

**Files:**
- Modify: `apps/mobile/src/i18n/fr.json`

**Steps:**

1. Add missing keys to `fr.json`:

```json
{
  "profile": {
    "title": "Mon profil",
    "fullName": "Nom complet",
    "phone": "Téléphone",
    "email": "E-mail",
    "save": "Enregistrer",
    "saved": "Profil mis à jour !",
    "logout": "Se déconnecter",
    "logoutConfirm": "Êtes-vous sûr de vouloir vous déconnecter ?",
    "logoutYes": "Oui, déconnecter",
    "logoutNo": "Annuler"
  },
  "errors": {
    "network": "Erreur de connexion. Vérifiez votre réseau.",
    "server": "Erreur du serveur. Réessayez plus tard.",
    "unknown": "Une erreur est survenue.",
    "validation": "Veuillez vérifier les champs."
  }
}
```

These keys are added alongside existing sections (orders, rating, chat, etc.).

2. Add `orders.emptyActive` and `orders.emptyHistory` keys:
```json
"orders": {
  ...existing keys...,
  "emptyActive": "Aucune commande en cours.",
  "emptyHistory": "Aucune commande terminée."
}
```

3. Add `home.recentOrders` key:
```json
"home": {
  ...existing keys...,
  "recentOrders": "Commandes récentes"
}
```

**Validation gate:** `pnpm --filter @babloo/mobile exec tsc --noEmit`

**Commit:** `feat(mobile): add profile, error, and home i18n strings`

---

### Task 3: ProfileScreen

**Files:**
- Modify: `apps/mobile/src/screens/settings/ProfileScreen.tsx`
- Create: `apps/mobile/src/services/mutations/user.ts`

**Steps:**

1. Create `apps/mobile/src/services/mutations/user.ts`:

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { fullName?: string }) => {
      const res = await api.patch('/users/me', data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
}
```

2. Rewrite `ProfileScreen.tsx`:
   - Use `useMe()` to fetch user data
   - Editable `fullName` field with TextInput
   - Read-only phone + email fields (gray text, non-editable)
   - "Enregistrer" button calls `useUpdateProfile`
   - "Se déconnecter" button at bottom with Alert confirmation, calls `signOut` from `useAuth()`
   - Loading state while fetching user
   - Success Alert after save

**Validation gate:** `pnpm --filter @babloo/mobile exec tsc --noEmit`

**Commit:** `feat(mobile): implement ProfileScreen with edit + logout`

---

### Task 4: HomeScreen polish

**Files:**
- Modify: `apps/mobile/src/screens/home/HomeScreen.tsx`
- Modify: `apps/mobile/src/navigation/HomeStack.tsx` (if OrderDetail needs to be reachable from HomeStack)

**Steps:**

1. Check if `HomeStack` can navigate to `OrderDetail`. If not, add it to `HomeStackParamList`.

2. Update `HomeScreen.tsx`:
   - Import `useOrders` from queries
   - Filter first 3 non-terminal orders from `useOrders` data
   - Add "Commandes récentes" section between CTA button and service grid
   - Each card shows: service label, status badge, date — tapping navigates to OrderDetail
   - Section entirely hidden when no active orders
   - Keep existing service quick-cards unchanged

**Validation gate:** `pnpm --filter @babloo/mobile exec tsc --noEmit`

**Commit:** `feat(mobile): add recent orders section to HomeScreen`

---

### Task 5: Accessibility audit — auth + booking screens

**Files:**
- Modify: `apps/mobile/src/screens/auth/AuthEntryScreen.tsx`
- Modify: `apps/mobile/src/screens/auth/SignInEmailScreen.tsx`
- Modify: `apps/mobile/src/screens/auth/SignInPhoneScreen.tsx`
- Modify: `apps/mobile/src/screens/auth/SignUpEmailScreen.tsx`
- Modify: `apps/mobile/src/screens/auth/SignUpPhoneScreen.tsx`
- Modify: `apps/mobile/src/screens/auth/OtpScreen.tsx`
- Modify: `apps/mobile/src/screens/auth/ForgotPasswordScreen.tsx`
- Modify: `apps/mobile/src/screens/booking/ServiceSelectionScreen.tsx`
- Modify: `apps/mobile/src/screens/booking/ServiceDetailScreen.tsx`
- Modify: `apps/mobile/src/screens/booking/OrderConfirmScreen.tsx`

**Steps:**

For each screen:
1. Add `accessibilityRole="button"` to all `TouchableOpacity` elements
2. Add descriptive `accessibilityLabel` to all interactive elements (buttons, inputs)
3. Add `accessibilityLabel` to all `TextInput` elements matching their placeholder/label
4. Ensure touch targets are ≥ 44px tall (add `minHeight: 44` to small buttons if needed)
5. Add `accessibilityRole="header"` to screen titles

**Validation gate:** `pnpm --filter @babloo/mobile exec tsc --noEmit`

**Commit:** `fix(mobile): add accessibility labels to auth and booking screens`

---

### Task 6: Accessibility audit — orders + chat + settings screens

**Files:**
- Modify: `apps/mobile/src/screens/orders/OrdersListScreen.tsx`
- Modify: `apps/mobile/src/screens/orders/OrderDetailScreen.tsx`
- Modify: `apps/mobile/src/screens/orders/RatingScreen.tsx`
- Modify: `apps/mobile/src/screens/chat/ChatScreen.tsx`
- Modify: `apps/mobile/src/screens/settings/ProfileScreen.tsx`
- Modify: `apps/mobile/src/screens/home/HomeScreen.tsx`
- Modify: `apps/mobile/src/components/NegotiationBar.tsx`

**Steps:**

1. OrdersListScreen: add `accessibilityRole="tab"` + `accessibilityState={{ selected }}` to tab buttons, `accessibilityRole="button"` to order cards
2. OrderDetailScreen: `accessibilityLabel` on status badge, back button, cancel button, negotiate button, rate button. Star display gets `accessibilityLabel={`${stars} étoiles sur 5`}`
3. RatingScreen: star buttons get `accessibilityValue={{ min: 1, max: 5, now: stars }}`, submit button, comment input
4. ChatScreen: message input, send button, offer accept button, back button
5. ProfileScreen: all inputs, save button, logout button
6. HomeScreen: service cards, recent order cards, book button
7. NegotiationBar: slider, propose button, price display

**Validation gate:** `pnpm --filter @babloo/mobile exec tsc --noEmit`

**Commit:** `fix(mobile): add accessibility labels to orders, chat, and settings screens`

---

### Task 7: E2E test infrastructure

**Files:**
- Create: `apps/api/src/__tests__/e2e/globalSetup.e2e.ts`
- Create: `apps/api/src/__tests__/e2e/globalTeardown.e2e.ts`
- Create: `apps/api/src/__tests__/e2e/helpers.ts`
- Create: `apps/api/vitest.e2e.config.ts`
- Modify: `apps/api/package.json` (add `test:e2e` script)

**Steps:**

1. Install testcontainers: `pnpm --filter @babloo/api add -D testcontainers @testcontainers/postgresql`

2. Create `globalSetup.e2e.ts`:
```typescript
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { execSync } from 'node:child_process';

let container: any;

export async function setup() {
  container = await new PostgreSqlContainer('postgres:16-alpine')
    .withDatabase('babloo_test')
    .withUsername('test')
    .withPassword('test')
    .start();

  const url = container.getConnectionUri();
  process.env.DATABASE_URL = url;

  // Run Prisma migrations against the test DB
  execSync('npx prisma migrate deploy', {
    cwd: new URL('../../..', import.meta.url).pathname,
    env: { ...process.env, DATABASE_URL: url },
    stdio: 'pipe',
  });

  // Store for teardown
  (globalThis as any).__TESTCONTAINER__ = container;
}

export async function teardown() {
  const c = (globalThis as any).__TESTCONTAINER__;
  if (c) await c.stop();
}
```

3. Create `globalTeardown.e2e.ts` — delegates to the stored container reference.

4. Create `helpers.ts` with:
   - `truncateAll()` — truncates all tables in dependency order
   - `signupUser(email, password, fullName)` — calls supertest, returns `{ accessToken, refreshToken }`
   - `makeProUser(email, password, fullName)` — signup + Prisma update to set `role: 'pro'` + create Professional record
   - `authHeader(token)` — returns `{ Authorization: 'Bearer ${token}' }`

5. Create `vitest.e2e.config.ts`:
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/__tests__/e2e/**/*.test.ts'],
    globalSetup: ['src/__tests__/e2e/globalSetup.e2e.ts'],
    testTimeout: 30000,
    hookTimeout: 60000,
  },
});
```

6. Add `"test:e2e": "vitest run --config vitest.e2e.config.ts"` to `apps/api/package.json`.

**Validation gate:** `pnpm --filter @babloo/api exec tsc --noEmit` (infrastructure compiles, no tests yet)

**Commit:** `feat(api): add E2E test infrastructure with testcontainers Postgres`

---

### Task 8: E2E critical-path test

**Files:**
- Create: `apps/api/src/__tests__/e2e/critical-path.e2e.test.ts`

**Steps:**

Write the full critical-path test in one `describe` block with sequential `it` blocks sharing state via closures:

```
describe('Critical path: signup → order → negotiate → complete → rate')
  - it('client signs up')
  - it('pro signs up and is assigned pro role')
  - it('client creates a ménage order')
  - it('order is submitted with correct floor price')
  - it('pro sends a message')
  - it('pro creates an offer at floor price')
  - it('client accepts the offer')
  - it('order finalPrice is locked')
  - it('pro advances status: accepted → en_route')
  - it('pro advances status: en_route → in_progress')
  - it('pro advances status: in_progress → completed')
  - it('client submits a rating')
  - it('pro weighted average is updated')
  - it('duplicate rating returns 409')
```

Each test uses supertest against the imported `app`, with real Prisma queries hitting the ephemeral Postgres. Pro user needs an `OrderAssignment` record to be recognized as participant — create that via Prisma in the setup.

**Validation gate:** `cd apps/api && pnpm exec vitest run --config vitest.e2e.config.ts` (all E2E tests pass, requires Docker running)

**Commit:** `test(api): add critical-path E2E test with real Postgres`

---

### Task 9: EAS build config

**Files:**
- Create: `apps/mobile/eas.json`
- Modify: `apps/mobile/app.json`

**Steps:**

1. Create `apps/mobile/eas.json`:
```json
{
  "cli": { "version": ">= 14.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {}
  },
  "submit": {
    "production": {}
  }
}
```

2. Update `apps/mobile/app.json`:
   - `"name": "Babloo"`
   - `"slug": "babloo"`
   - `"scheme": "babloo"`
   - `"ios.bundleIdentifier": "com.babloo.app"`
   - `"android.package": "com.babloo.app"`
   - `splash.backgroundColor`: `"#EDEEF6"`
   - Keep existing icon/splash image paths

**Validation gate:** `pnpm --filter @babloo/mobile exec tsc --noEmit` (app.json changes don't break types)

**Commit:** `chore(mobile): add EAS build config and app branding`

---

## Execution Order

1. Task 1 (error constants — API refactor, no deps)
2. Task 2 (i18n — mobile, no deps, needed by Tasks 3-4)
3. Task 3 (ProfileScreen — uses i18n keys from Task 2)
4. Task 4 (HomeScreen — uses i18n keys from Task 2)
5. Task 5 (a11y auth + booking — independent)
6. Task 6 (a11y orders + chat + settings — after Task 3 modifies ProfileScreen)
7. Task 7 (E2E infra — API, independent of mobile work)
8. Task 8 (E2E test — depends on Task 7 infra)
9. Task 9 (EAS config — independent, do last)

## Verification Gates

After each API task: `pnpm --filter @babloo/api exec tsc --noEmit`
After each mobile task: `pnpm --filter @babloo/mobile exec tsc --noEmit`
After Task 1: `pnpm --filter @babloo/api exec vitest run` (80/80)
After Task 8: `pnpm --filter @babloo/api exec vitest run --config vitest.e2e.config.ts`
Final: all 4 checks (shared 55/55, API 80/80, API tsc, mobile tsc) + E2E pass
