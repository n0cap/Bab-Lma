# M7 — Client UX Polish & Missing Screens

**Date:** 2026-03-01
**Status:** Draft
**Goal:** Make the React Native mobile app match the HTML prototype for the client role. Defer fidélisation and pro/admin UX.

---

## Scope

### In Scope
- Visual polish of all existing client screens to match the HTML prototype
- Build missing screens: Search, Order Confirmed, Status Tracking, Location Modal, Pro Selection Modal
- Foundation primitives (Button, Card, Input, BackHeader, Chip, ProgressBar, Avatar, Stepper, Toggle)
- Add shadow tokens to theme

### Out of Scope
- Fidélisation system (squad review, configure, calendar, contract, dashboard) — deferred
- Professional UX — deferred
- Admin/Manager UX — deferred
- Backend/API changes — none
- Navigation structure changes — minimal (only adding new screens to existing stacks)
- SSO (Google/Apple) — stub buttons only, no backend integration

---

## Architecture Decisions

1. **Theme tokens are single source of truth** — all components use `colors`, `spacing`, `radius`, `textStyles` from `src/theme/`
2. **Shadow tokens added** — the prototype uses 4 shadow levels (sm/md/lg/xl) not yet in the theme
3. **Components live in `src/components/`** — one file per component, named exports
4. **No deep abstractions** — primitives are thin wrappers with props, not a design system framework
5. **Screens own their layout** — components provide building blocks, screens compose them

---

## Workstream 1: Foundation (blocking, do first)

### Token additions to `src/theme/spacing.ts`
```ts
export const shadows = {
  sm: { shadowColor: '#0E1442', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 2 },
  md: { shadowColor: '#0E1442', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.10, shadowRadius: 20, elevation: 4 },
  lg: { shadowColor: '#0E1442', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.14, shadowRadius: 40, elevation: 8 },
  xl: { shadowColor: '#0E1442', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.18, shadowRadius: 60, elevation: 12 },
} as const;
```

### Primitives to create in `src/components/`

| Component | Props | Notes |
|-----------|-------|-------|
| `Button` | variant: primary/clay/outline/ghost/xs, label, onPress, disabled, icon?, loading? | Height 52px (30px for xs), full-width, pill radius |
| `Card` | children, style? | surface bg, radius.lg, padding 18, shadow.sm |
| `Input` | value, onChangeText, placeholder, label?, error?, secureTextEntry? | 1.5px border, radius.md, 14px font |
| `BackHeader` | title, onBack, right? (ReactNode) | surface bg, border-bottom, 34px back circle |
| `Chip` | label, variant: default/navy/success/clay/warning | pill, 10px bold, 1.5px border |
| `ProgressBar` | progress (0-1), color? | 4px height, rounded |
| `Avatar` | initials, size: sm/md/lg/xl, variant: a/b/c/user | gradient bg per variant |
| `Stepper` | value, onChange, min?, max? | - / value / + buttons, 34px circles |
| `Toggle` | value, onToggle | 42x24, navy when on |

### Files touched
- `src/theme/spacing.ts` — add shadows export
- `src/theme/index.ts` — re-export shadows
- `src/components/Button.tsx` — new
- `src/components/Card.tsx` — new
- `src/components/Input.tsx` — new
- `src/components/BackHeader.tsx` — new
- `src/components/Chip.tsx` — new
- `src/components/ProgressBar.tsx` — new
- `src/components/Avatar.tsx` — new
- `src/components/Stepper.tsx` — new
- `src/components/Toggle.tsx` — new
- `src/components/index.ts` — barrel export

### Guardrails
- NO screen files touched
- NO navigation changes
- NO API/service changes
- All components must import tokens from `src/theme/`

---

## Workstream 2: Auth Visual Polish

### Screens to restyle (7 total)
1. `AuthEntryScreen.tsx` — Add navy hero section with blobs, logo + wordmark, tagline, auth-card with rounded top, sign-in/sign-up tabs with sliding indicator, SSO stubs (Google/Apple), divider, email/phone method buttons, legal text on signup
2. `SignInEmailScreen.tsx` — Display title "Bon retour.", styled field group, eye toggle on password, forgot password link, loading spinner on submit
3. `SignInPhoneScreen.tsx` — Display title "Bon retour.", phone row with 🇲🇦 +212 prefix pill, styled input
4. `SignUpEmailScreen.tsx` — 2-step progress bar (step 1/2), display title "Créer un compte.", email + password + confirm fields, 8-char hint, eye toggles
5. `SignUpPhoneScreen.tsx` — Progress bar (step 2/2), display title "Votre numéro.", phone input with prefix
6. `OtpScreen.tsx` — Icon badge (navy gradient ring), title "Code envoyé par SMS", 6 individual OTP boxes (46x58 each), error shake animation, resend countdown, change number link, success overlay
7. `ForgotPasswordScreen.tsx` — Display title "Mot de passe oublié?", email input, success state with green check

### Design patterns from prototype
- **Auth hero**: navy bg, two circular blobs (clay 22% opacity, white 6% opacity), logo mark + "Babloo" wordmark
- **Auth card**: bg color, rounded top corners (radius.xl), negative margin overlapping hero, shadow
- **Auth tabs**: bg-alt pill container, sliding indicator (navy bg, white text), 4px padding
- **Display titles**: Fraunces serif, large, with clay-colored period/question mark
- **Field labels**: DM Sans 12px bold, above inputs
- **Field errors**: red text below inputs, hidden by default
- **Global errors**: red alert banner with icon
- **CTA buttons**: full-width, 52px, primary variant, with loading spinner state
- **Eye toggle**: positioned absolutely inside password input wrapper

### Files touched
- `src/screens/auth/AuthEntryScreen.tsx`
- `src/screens/auth/SignInEmailScreen.tsx`
- `src/screens/auth/SignInPhoneScreen.tsx`
- `src/screens/auth/SignUpEmailScreen.tsx`
- `src/screens/auth/SignUpPhoneScreen.tsx`
- `src/screens/auth/OtpScreen.tsx`
- `src/screens/auth/ForgotPasswordScreen.tsx`

### Guardrails
- NO navigation structure changes (keep same screen names, same stack)
- NO API call changes (keep existing mutations/auth logic)
- NO new dependencies without approval
- Import and use components from `src/components/` (Button, Input, Chip, ProgressBar)
- All colors/fonts/spacing from theme tokens

---

## Workstream 3: Core Screens Visual Polish

### Screens to restyle (9 total)

1. **HomeScreen** — Location bar at top (pill with pin icon + zone name + chevron), promo banner (navy gradient card with clay accent, "Votre 1er service Maid est offert"), 3x2 service grid (ménage/cuisine/baby-sitting + 3 "bientôt" disabled), bottom nav bar with badge on Orders
2. **ServiceDetailScreen (ménage)** — Step indicator (3 colored bars), type selection (2-column grid cards: simple vs deep), surface slider with m² display + team recommendation chip, team picker (solo/duo/squad cards), dark price card (navy gradient: floor price + duration estimate + info note), instructions textarea
3. **ServiceDetailScreen (cuisine)** — Warning banner (yellow, "courses non incluses"), dishes textarea, guest stepper, dark price card
4. **ServiceDetailScreen (childcare)** — Children stepper, hours stepper, notes textarea, dark price card
5. **OrderConfirmScreen** — Recap card (service type, details rows, address, payment), dark price block (navy, floor price + "négocié via chat"), next-steps section (4 numbered steps), clay CTA button
6. **OrdersListScreen** — Header with logo, list of order cards with status chips, nav bar
7. **OrderDetailScreen** — BackHeader with status chip, dynamic content area, timeline
8. **ChatScreen** — BackHeader with avatar + name + role + "En ligne", chat bubbles, negotiation panel with price slider + quick buttons, message input bar
9. **RatingScreen** — "Prestation terminée" header, global star rating (32px stars), comment textarea, tip grid (4 options), fidélisation teaser banner (navy gradient, deferred — just show banner with "Bientôt" label)

### Files touched
- `src/screens/home/HomeScreen.tsx`
- `src/screens/booking/ServiceSelectionScreen.tsx`
- `src/screens/booking/ServiceDetailScreen.tsx`
- `src/screens/booking/OrderConfirmScreen.tsx`
- `src/screens/orders/OrdersListScreen.tsx`
- `src/screens/orders/OrderDetailScreen.tsx`
- `src/screens/chat/ChatScreen.tsx`
- `src/screens/orders/RatingScreen.tsx`
- `src/components/NegotiationBar.tsx` (restyle existing)

### Guardrails
- NO API changes
- NO navigation structure changes
- Keep all existing data fetching / mutations
- Import components from `src/components/`
- Fidélisation teaser on rating screen shows "Bientôt" — no navigation to fid screens

---

## Workstream 4: Missing Screens

### New screens to build (5 total)

1. **SearchScreen** — Animated search state (spinner + progress bar + status text), then results state (pro cards with avatar, name, role, rating, skills chips, "Voir le profil" CTA). For prototype: use mock data, no real search API.
2. **ProSelectionModal** — Bottom sheet modal with pro details: large avatar, name, rating, skills, review count. "Sélectionner" CTA.
3. **OrderConfirmedScreen** — Success icon (green check), title "Commande confirmée!", subtitle, recap card, "Suivre ma commande" CTA.
4. **StatusTrackingScreen** — BackHeader with order title + status chip, timeline with status dots, pro assignment card, live status updates. Use mock status progression for prototype.
5. **LocationModal** — Bottom sheet with search input, zone pills (Agdal, Hay Riad, Hassan, Salé Médina, Tabriquet), out-of-zone warning banner.

### Files to create
- `src/screens/booking/SearchScreen.tsx`
- `src/components/ProSelectionModal.tsx`
- `src/screens/orders/OrderConfirmedScreen.tsx`
- `src/screens/orders/StatusTrackingScreen.tsx`
- `src/components/LocationModal.tsx`

### Navigation changes (minimal)
- Add `Search` screen to `BookingStack` or `HomeStack`
- Add `OrderConfirmed` to `OrdersStack`
- Add `StatusTracking` to `OrdersStack`
- LocationModal rendered as overlay in HomeScreen
- ProSelectionModal rendered as overlay in SearchScreen

### Guardrails
- Mock data only — no new API endpoints
- Use existing navigation patterns (stack navigators)
- Import components from `src/components/`
- NO changes to existing screen files
- NO backend changes

---

## Execution Order

```
Workstream 1 (Foundation)
    │
    ├── Workstream 2 (Auth Polish)      ── parallel ──┐
    ├── Workstream 3 (Core Polish)      ── parallel ──┤
    └── Workstream 4 (Missing Screens)  ── parallel ──┘
                                                       │
                                          Workstream 5 (Component Extraction — future)
```

---

## Acceptance Criteria Per Screen State

Each screen must handle:
- **Default/filled** — matches prototype layout, colors, typography, spacing
- **Loading** — spinner or skeleton where data is fetched
- **Empty** — graceful empty state where applicable
- **Error** — error banners/toasts match prototype styling

---

## Reference

- HTML prototype: `prototype/Babloo Complete Version.html`
- Design tokens: `apps/mobile/src/theme/`
- Existing components: `apps/mobile/src/components/`
- Navigation: `apps/mobile/src/navigation/`
