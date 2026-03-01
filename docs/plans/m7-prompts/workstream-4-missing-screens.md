# Workstream 4: Missing Screens

## Context

You are working on a React Native + Expo 55 mobile app (TypeScript) in `apps/mobile/`.
You need to create new screens that exist in the HTML prototype but are not yet in the app.
These screens use **mock data** — no new API endpoints are needed.

**Reference:** `prototype/Babloo Complete Version.html` — screen IDs: `s-search`, `modal-pro-select`, `s-order-confirmed`, `s-status`, `modal-location`

**Shared components:** Import from `../components` — Button, Card, Input, BackHeader, Chip, ProgressBar, Avatar.

**Theme tokens:** Import from `../theme`.

**Navigation:** The app uses React Navigation 7. Existing stacks:
- `HomeStack` (Home + BookingStack screens)
- `OrdersStack` (OrdersList, OrderDetail, Chat, Rating)
- `AuthStack` (auth screens)

## New Screens to Build

### 1. SearchScreen.tsx (`src/screens/booking/SearchScreen.tsx`)

**Purpose:** Shows a search animation then reveals matched professionals.

**Phase 1 — Searching (animated):**
- BackHeader: "Recherche en cours", right: Chip warning "Recherche…"
- Centered content:
  - Spinner: 100px circle, 3px border (border color), border-top clay, rotating animation (1s linear infinite)
  - Inside spinner: search icon (32px, navy)
  - Title: "Nous cherchons votre équipe" — h1, centered
  - Subtitle: "Professionnelles disponibles dans votre quartier en ce moment…" — body, centered
  - Progress bar: max-width 260px, 6px height, clay gradient fill, animates from 0% to 100% over ~5 seconds
  - Status text: "Vérification des disponibilités…" → "Analyse des profils…" → "Sélection des meilleures…" (cycle through with timers)

**Phase 2 — Results (after ~5s):**
- Success header: green check icon + "Professionnelles trouvées" (h2)
- Pro cards (mock data, 2-3 cards):
  - Card 1 (selected): surface bg, radius.lg, 16px padding, shadow.sm, **2px navy border**
    - Row: Avatar lg variant-a "FZ" + name "Fatima Zahra" (15px 700 navy) + role "Coordinatrice · 7 ans d'exp." (11px textSec) + rating "4.9" star + "47 prestations"
    - Skills row: Chip navy "Ménage", Chip navy "Cuisine", Chip default "Fiabilité 96%"
    - CTA text: clay color "Voir le profil et sélectionner" with chevron
  - Card 2: same layout but 1.5px border color (not selected)
    - "Khadija Benali", variant-b "KB", "Spécialiste sol · 4 ans", 4.7, 31 prestations
    - Skills: Ménage, Repassage, Fiabilité 91%
- onPress card: open ProSelectionModal

**State management:** Use `useState` for phase (searching/results). Use `useEffect` with setTimeout to transition after 5s.

### 2. ProSelectionModal.tsx (`src/components/ProSelectionModal.tsx`)

**Purpose:** Bottom sheet showing detailed pro profile with select CTA.

- Modal overlay: absolute fill, navy 55% opacity, backdrop-blur (or just dim)
- Sheet: surface bg, radius.xl top corners, padding 16px 20px 36px, max-height 82%, scrollable
- Handle: 38x4px, borderStrong bg, centered, margin-bottom 18px
- Content (dynamic based on selected pro):
  - Large Avatar (xl size)
  - Name: h1
  - Role + experience: body text
  - Rating: stars + count
  - Skills section: chips
  - Review quotes (mock): 2-3 short text quotes in cards
- CTA: Button clay "Sélectionner cette professionnelle"
- onSelect: navigate to OrderConfirmedScreen (for prototype flow) or show toast

**Props:** `visible: boolean`, `onClose`, `pro: { name, initials, variant, role, rating, count, skills }`, `onSelect`

### 3. OrderConfirmedScreen.tsx (`src/screens/orders/OrderConfirmedScreen.tsx`)

**Purpose:** Success state after order is confirmed and pro assigned.

- Header section: surface bg, centered
  - Green check icon: 48px, success color
  - Title: "Commande confirmée !" — h1
  - Subtitle: "Votre prestation est en route" — body
- Scrollable content:
  - Order summary card (mock or passed via nav params): service type, pro name, estimated time, price
- CTA bar: Button primary "Suivre ma commande" with clock icon
  - onPress: navigate to StatusTrackingScreen

### 4. StatusTrackingScreen.tsx (`src/screens/orders/StatusTrackingScreen.tsx`)

**Purpose:** Live order tracking with status timeline.

- BackHeader: title from order (e.g., "Commande ORD-X7K2P"), right: Chip success "Confirmé"
- Scrollable content with status timeline:
  - Timeline: vertical line (2px, border color) with status dots
  - Each step: colored dot (8px circle) + label + timestamp
  - Steps (mock): Confirmée ✓, En route ✓, Arrivée ✓ (or pending dots for future states)
  - Active step: clay dot, pulsing animation
- Pro card: Avatar + name + role + "En route" status
- Order details card: service summary, price, address
- For the prototype, use mock data with a useEffect timer that advances status every few seconds

### 5. LocationModal.tsx (`src/components/LocationModal.tsx`)

**Purpose:** Bottom sheet for selecting service address/zone.

- Same modal pattern as ProSelectionModal (overlay + sheet)
- Title: "Adresse de service" — Fraunces 18px bold
- Subtitle: "Babloo opère uniquement dans Rabat et Salé" — 12px textMuted
- Search input: Input component, placeholder "Rechercher une adresse..."
- Zone section: label "ZONES DISPONIBLES"
- Zone pills (5 total): pressable rows with:
  - Green/pink dot (10px circle, success or proB color)
  - Zone name: 13px 600 navy
  - City: 11px textMuted
  - Selected: navy border, checkmark icon
  - Zones: Agdal (Rabat, default selected), Hay Riad (Rabat), Hassan (Rabat), Salé Médina (Salé), Tabriquet (Salé)
- Out-of-zone warning: error-tinted bg, error border, error text with X icon

**Props:** `visible: boolean`, `onClose`, `selectedZone: string`, `onSelectZone: (zone: string) => void`

## Navigation Changes

Add these screens to existing navigators:

### In `src/navigation/HomeStack.tsx` (or `BookingStack.tsx`):
```ts
<Stack.Screen name="Search" component={SearchScreen} />
```

### In `src/navigation/OrdersStack.tsx`:
```ts
<Stack.Screen name="OrderConfirmed" component={OrderConfirmedScreen} />
<Stack.Screen name="StatusTracking" component={StatusTrackingScreen} />
```

### Update type definitions if using typed navigation:
Add the new screen names to the relevant param list types.

## Mock Data

Use hardcoded mock data for all screens. Example pro data:

```ts
const MOCK_PROS = [
  {
    id: 'pro-a',
    name: 'Fatima Zahra',
    initials: 'FZ',
    variant: 'a' as const,
    role: 'Coordinatrice',
    experience: '7 ans',
    rating: 4.9,
    sessions: 47,
    reliability: 96,
    skills: ['Ménage', 'Cuisine'],
  },
  {
    id: 'pro-b',
    name: 'Khadija Benali',
    initials: 'KB',
    variant: 'b' as const,
    role: 'Spécialiste sol',
    experience: '4 ans',
    rating: 4.7,
    sessions: 31,
    reliability: 91,
    skills: ['Ménage', 'Repassage'],
  },
];
```

## Guardrails

- **CREATE** new files only in `src/screens/booking/`, `src/screens/orders/`, `src/components/`
- **MODIFY** only navigation files (`HomeStack.tsx` or `BookingStack.tsx`, `OrdersStack.tsx`) to register new screens
- Do NOT modify existing screen files
- Do NOT modify `src/services/`, `src/contexts/`
- Do NOT add new API calls or endpoints
- Do NOT add new npm dependencies
- All mock data is hardcoded in the screen files
- Import shared components from `../components`
- All styling uses theme tokens

## Verification

```bash
cd apps/mobile && npx tsc --noEmit
```
Verify each new screen renders correctly in Expo Go. Check navigation flow: Booking → Search → Pro Modal → Order Confirmed → Status Tracking.
