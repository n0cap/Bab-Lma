# Workstream 9: Replace Placeholder Icons with SVG Icons

## Context

You are working on a React Native + Expo 55 mobile app (TypeScript) in `apps/mobile/`.

**Problem:** Every icon in the app is a placeholder text character (`◻`, `◯`, `◉`, `i`, `✓`, `✕`). These need to be replaced with proper SVG icons using `react-native-svg` which is already installed (`"react-native-svg": "^15.15.3"`).

**Theme tokens:** Import from `../theme`.

## Step 1: Create an Icon component library

Create `src/components/icons.tsx` — a single file with all SVG icon components used across the app.

Each icon should be a simple functional component that accepts `size` (default 24) and `color` (default `colors.navy`) props, and renders an SVG using `react-native-svg`'s `Svg`, `Path`, `Circle`, `Line`, `Rect`, `G` components.

**Icons needed:**

### Navigation / Tab bar:
1. **HomeIcon** — house outline (for "Accueil" tab)
2. **OrdersIcon** — clipboard/list outline (for "Commandes" tab)
3. **LoyaltyIcon** — heart/star outline (for "Fidèles" tab)
4. **SettingsIcon** — gear outline (for "Paramètres" tab)

### Service grid (HomeScreen):
5. **CleaningIcon** — broom/sparkle (for "Ménage")
6. **CookingIcon** — chef hat/pot (for "Cuisine")
7. **BabysittingIcon** — baby/cradle (for "Baby-sitting")
8. **PlumbingIcon** — wrench (for "Plomberie")
9. **ElectricalIcon** — lightning bolt (for "Électricité")
10. **ITIcon** — laptop/monitor (for "Assistance IT")

### Actions / UI:
11. **SearchIcon** — magnifying glass
12. **ChevronDownIcon** — small downward chevron
13. **ChevronRightIcon** — small right chevron
14. **ArrowRightIcon** — right arrow
15. **BackIcon** — left arrow/chevron (for BackHeader)
16. **CheckIcon** — checkmark circle
17. **CloseIcon** — X mark
18. **InfoIcon** — info circle (i)
19. **WarningIcon** — triangle with exclamation
20. **StarIcon** — filled star (for ratings)
21. **StarOutlineIcon** — outline star
22. **CameraIcon** — camera (for chat input)
23. **MicIcon** — microphone (for chat input)
24. **SendIcon** — paper plane / send arrow
25. **ClockIcon** — clock/timer
26. **LocationPinIcon** — map pin (for location pill)
27. **ChatIcon** — speech bubble (for negotiation)

**Design style:**
- Stroke-based (outline), not filled — matching the prototype's clean line-icon style
- strokeWidth: 1.5 or 2 (consistent across all icons)
- strokeLinecap: "round", strokeLinejoin: "round"
- Default viewBox: "0 0 24 24"
- Each icon exports a named function component

**Example icon:**
```tsx
import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../theme';

interface IconProps {
  size?: number;
  color?: string;
}

export function HomeIcon({ size = 24, color = colors.navy }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M9 22V12h6v10" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
```

Use standard Feather/Lucide-style SVG paths for recognizable icons. Keep paths simple and clean.

## Step 2: Export from barrel

Add to `src/components/index.ts`:
```ts
export * from './icons';
```

## Step 3: Replace placeholders in HomeScreen

**File:** `src/screens/home/HomeScreen.tsx`

Replace:
- Service grid icons: `◻` → `CleaningIcon`, `CookingIcon`, `BabysittingIcon` for active services, and `PlumbingIcon`, `ElectricalIcon`, `ITIcon` for disabled ones
- Navigation icons (if still inline after WS5): `◯` → `HomeIcon`, `OrdersIcon`, `LoyaltyIcon`, `SettingsIcon`
- Location pill pin: the custom `pinWrap`/`pinDot` View → `LocationPinIcon` with `color={colors.clay}` and `size={16}`
- Chevron: `⌄` text → `ChevronDownIcon` with `color={colors.textMuted}` and `size={14}`
- Promo CTA arrow: `↑` → `ArrowRightIcon` with `color={colors.white}` and `size={14}`

For the service grid, wrap each icon in the existing `serviceIconBox` View:
```tsx
<View style={styles.serviceIconBox}>
  <CleaningIcon size={24} color={colors.navy} />
</View>
```

For disabled services, use `colors.textMuted` as the icon color.

## Step 4: Replace placeholders in ServiceDetailScreen

**File:** `src/screens/booking/ServiceDetailScreen.tsx`

Replace:
- Type card icons: `◻` → appropriate icons (e.g., simple broom for "Ménage simple", sparkle/deep clean icon for "Ménage profond")
- Estimate card info icon: `i` → `InfoIcon` with `color="rgba(255,255,255,0.55)"` and `size={14}`
- CTA arrow: `›` → `ChevronRightIcon` with `color={colors.white}` and `size={16}`
- Warning icon: `i` → `WarningIcon` with `color={colors.warning}` and `size={16}`

## Step 5: Replace placeholders in OrderConfirmScreen

**File:** `src/screens/booking/OrderConfirmScreen.tsx`

Replace:
- Price side icon: `◯` → `ChatIcon` with `color={colors.white}` and `size={22}`
- CTA arrow: `›` → `ChevronRightIcon`

## Step 6: Replace placeholders in ChatScreen

**File:** `src/screens/chat/ChatScreen.tsx`

Replace:
- Camera icon: `◉` (line 205) → `CameraIcon` with `color={colors.textMuted}` and `size={20}`
- Send/mic icon: `◉` (line 226) → `SendIcon` when input has text, `MicIcon` when empty

## Step 7: Replace placeholders in RatingScreen

**File:** `src/screens/orders/RatingScreen.tsx`

Replace:
- Stars: `★` text → `StarIcon` (filled) and `StarOutlineIcon` (empty), `size={32}`

## Step 8: Replace placeholders in SearchScreen

**File:** `src/screens/booking/SearchScreen.tsx`

Replace:
- Success icon: `✓` → `CheckIcon` with `color={colors.success}` and `size={20}`
- Select text chevron: `›` → `ChevronRightIcon` inline

## Step 9: Replace in BottomTabBar (if created by WS5)

**File:** `src/components/BottomTabBar.tsx` (if exists)

Replace placeholder `◯` icons with `HomeIcon`, `OrdersIcon`, `LoyaltyIcon`, `SettingsIcon` — using `colors.navy` for active and `colors.textMuted` for inactive.

If `BottomTabBar.tsx` doesn't exist yet (WS5 hasn't run), skip this step and add a TODO comment.

## Step 10: Replace in BackHeader

**File:** `src/components/BackHeader.tsx`

Check if the back button uses a text character. If so, replace with `BackIcon` (left chevron/arrow).

## Files to Create
- `src/components/icons.tsx`

## Files to Modify
- `src/components/index.ts` — add icons export
- `src/screens/home/HomeScreen.tsx`
- `src/screens/booking/ServiceDetailScreen.tsx`
- `src/screens/booking/OrderConfirmScreen.tsx`
- `src/screens/booking/SearchScreen.tsx`
- `src/screens/chat/ChatScreen.tsx`
- `src/screens/orders/RatingScreen.tsx`
- `src/components/BackHeader.tsx` (if it uses text icons)
- `src/components/BottomTabBar.tsx` (if it exists from WS5)

## Guardrails

- **CREATE** only `src/components/icons.tsx`
- **MODIFY** only the files listed above
- Do NOT modify navigation files
- Do NOT modify services, contexts, or API code
- Do NOT add new npm dependencies — `react-native-svg` is already installed
- Do NOT change any business logic, data fetching, or state management
- All icon colors must use theme tokens (colors.navy, colors.textMuted, colors.clay, etc.)
- Keep all existing `accessibilityRole` and `accessibilityLabel` props
- Icons should be simple and clean — don't over-design with excessive paths
- Each icon component must accept `size` and `color` props with sensible defaults

## Verification

```bash
cd apps/mobile && npx tsc --noEmit
```

Visual checks:
1. HomeScreen service grid shows distinct recognizable icons for each service
2. Bottom tab bar (if exists) shows different icons for each tab
3. Location pill has a pin icon instead of circles
4. Chat screen has camera and send/mic icons
5. Rating screen has proper star icons
6. All icons respect active/inactive/disabled color states
7. No remaining `◻`, `◯`, `◉` placeholder text in any screen
