# WS11 — Pro Side UX Overhaul

## Goal
Redesign the professional's mobile experience: restructure navigation (bottom tabs), build a proper profile screen, add an Offers screen with filters, and add a calendar button to the Missions screen.

---

## Context

### Current state
- **ProMainTabs.tsx** has 3 tabs: `Missions` (ProStack), `Stats` (ProStatsScreen — placeholder), `Profil` (ProfileScreen — shared with client, only shows name/phone/email + logout)
- **ProHomeScreen** has greeting ("Bonjour {name}"), stats card (rating, sessions, reliability), availability toggle, and 3-tab order list (En attente / En cours / Terminées)
- **ProStack** has screens: ProHome, ProOrderDetail, Chat
- Tab bar uses built-in React Navigation tab bar (text glyphs: ⌂, ▤, ◎), NOT the custom BottomTabBar component
- **ProfileScreen** only supports editing `fullName` — no stats, no support, no edit profile sections
- There is **no Offers screen** — pros see all assigned orders in ProHomeScreen
- There are **no filters** on any pro screen

### Key files
| File | Current role |
|------|-------------|
| `apps/mobile/src/navigation/ProMainTabs.tsx` | 3-tab navigator (Missions, Stats, Profil) |
| `apps/mobile/src/navigation/ProStack.tsx` | Stack: ProHome → ProOrderDetail → Chat |
| `apps/mobile/src/screens/pro/ProHomeScreen.tsx` | Greeting + stats + 3-tab order list |
| `apps/mobile/src/screens/pro/ProStatsScreen.tsx` | Placeholder "coming soon" |
| `apps/mobile/src/screens/settings/ProfileScreen.tsx` | Shared profile (name/phone/email + logout) |
| `apps/mobile/src/services/queries/pro.ts` | `useProOrders()` — cursor-paginated |
| `apps/mobile/src/services/queries/proProfile.ts` | `useProProfile()` — rating, sessions, reliability, skills, zones, isAvailable |
| `apps/api/src/routes/pro.routes.ts` | GET /profile, PATCH /availability, GET /orders, POST /assignments/:id/decline |

---

## Implementation

### 1. Restructure ProMainTabs (4 tabs)

**File:** `apps/mobile/src/navigation/ProMainTabs.tsx`

Change from 3 tabs to 4 tabs:
```
Before: Missions | Stats   | Profil
After:  Missions | Offres  | Chat   | Profil
```

Tab definitions:
- **Missions** → `ProStack` (existing, unchanged)
- **Offres** → new `OffersStack` (contains OffersScreen → ProOrderDetail → Chat)
- **Chat** → new `ProChatListScreen` (list of active order chats)
- **Profil** → new `ProProfileScreen` (replaces shared ProfileScreen)

Use proper icons from the existing icon system (import from `../../components/icons`). If suitable icons don't exist, use text glyphs but make them visually clear.

**GUARDRAIL:** Do NOT modify `BottomTabBar.tsx` — that is the client-side tab bar. Pro uses React Navigation's built-in tab bar.

### 2. Create ProProfileScreen

**New file:** `apps/mobile/src/screens/pro/ProProfileScreen.tsx`

Layout (top to bottom):
1. **Header section** — Avatar (initials-based), full name (h2), rating stars + numeric, total sessions count
2. **"Modifier le profil"** button → navigates to existing ProfileScreen for name editing
3. **Stats card** — Rating, Total sessions, Reliability % (use data from `useProProfile()`)
4. **"Contacter le support"** button — `variant="outline"`, shows `Alert.alert` with support email for now
5. **"Se déconnecter"** button — `variant="clay"`, calls `signOut()` from `useAuth()`

Use existing components: `Avatar`, `Card`, `Button`, `BackHeader`.
Use existing hooks: `useProProfile()`, `useAuth()`, `useMe()`.

**GUARDRAIL:** Do NOT modify ProfileScreen.tsx — it stays shared. ProProfileScreen wraps/extends it.

### 3. Create OffersScreen with filters

**New file:** `apps/mobile/src/screens/pro/OffersScreen.tsx`

This screen shows incoming order offers that match the pro's skills/zones. For now, it queries the same `GET /v1/pro/orders` endpoint but with a filter for `status === 'negotiating'` AND `assignmentStatus === 'assigned'`.

**Filter bar** (horizontal ScrollView of Chip toggles):
- **Amount range**: Low (<200), Medium (200-400), High (400+) — filter on `floorPrice`
- **Surface area**: Small (<60m²), Medium (60-120m²), Large (120+m²) — filter on `detail.surface`
- **Team size**: Solo, Duo, Squad — filter on `detail.teamType`
- **Client rating**: 4+ stars, 3+ stars — filter on `client.rating` (if available, else skip)

All filters are **client-side** (applied to the fetched list). Use `useMemo` to filter the data.

**Offer card UX** (inDriver-style):
- Each offer is a `Card` showing: service type, location, floor price, surface/team info
- Prominent **"Accepter"** button on each card → navigates to Chat screen for that order (to start negotiation)
- Secondary **"Voir détails"** link → navigates to ProOrderDetail

**GUARDRAIL:** Do NOT create new API endpoints for this. Reuse `useProOrders()` with client-side filtering.

### 4. Create ProChatListScreen

**New file:** `apps/mobile/src/screens/pro/ProChatListScreen.tsx`

Shows all orders where the pro has active conversations (status in: negotiating, accepted, en_route, in_progress).

Each row: client avatar/initials, client name, last message preview (truncated), order service type chip, timestamp.

For now, derive this from `useProOrders()` filtered to active statuses. Navigate to Chat screen on tap.

**GUARDRAIL:** Do NOT add a messages list API endpoint. Reuse existing data.

### 5. Add Calendar button to ProHomeScreen

**File:** `apps/mobile/src/screens/pro/ProHomeScreen.tsx`

Add a "Calendrier personnel" button below the stats card, above the order tabs.
- `variant="outline"`, icon: calendar emoji or text
- On press: `Alert.alert('Bientôt', 'Le calendrier personnel arrive bientôt.')` — placeholder for now

**GUARDRAIL:** Do NOT implement calendar functionality. Just the button + placeholder alert.

### 6. Create OffersStack navigator

**New file:** `apps/mobile/src/navigation/OffersStack.tsx`

Stack navigator containing:
- `Offers` → `OffersScreen`
- `ProOrderDetail` → `ProOrderDetailScreen`
- `Chat` → `ChatScreen`

Follow the same pattern as `ProStack.tsx`.

---

## File ownership

| File | Action | Owner |
|------|--------|-------|
| `apps/mobile/src/navigation/ProMainTabs.tsx` | MODIFY — 4 tabs | WS11 |
| `apps/mobile/src/navigation/OffersStack.tsx` | CREATE | WS11 |
| `apps/mobile/src/screens/pro/ProProfileScreen.tsx` | CREATE | WS11 |
| `apps/mobile/src/screens/pro/OffersScreen.tsx` | CREATE | WS11 |
| `apps/mobile/src/screens/pro/ProChatListScreen.tsx` | CREATE | WS11 |
| `apps/mobile/src/screens/pro/ProHomeScreen.tsx` | MODIFY — add calendar button | WS11 |
| `apps/mobile/src/screens/pro/ProStatsScreen.tsx` | DELETE or repurpose (merged into ProProfileScreen) | WS11 |

### DO NOT TOUCH
- `apps/mobile/src/components/BottomTabBar.tsx` (client-side only)
- `apps/mobile/src/screens/settings/ProfileScreen.tsx` (shared, still used by client)
- `apps/api/src/routes/pro.routes.ts` (no new endpoints needed)
- `apps/mobile/src/navigation/ProStack.tsx` (keep as-is, serves Missions tab)
- Any client-side screens or navigation

---

## Acceptance criteria

1. Pro bottom bar shows exactly 4 tabs: Missions, Offres, Chat, Profil
2. ProProfileScreen shows header with rating + key info, edit profile, stats, contact support, logout
3. OffersScreen shows only `negotiating` + `assigned` orders with working client-side filters
4. Each filter chip toggles on/off and filters are combinable (AND logic)
5. Offer cards have a prominent "Accepter" button that navigates to Chat
6. ProChatListScreen lists active order conversations
7. Calendar button on ProHomeScreen shows placeholder alert
8. Existing functionality (order detail, chat, status updates) still works
9. `npx tsc --noEmit --project apps/api/tsconfig.json` passes with zero errors
