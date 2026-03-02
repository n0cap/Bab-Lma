# Workstream 8: Minor Fixes Bundle

## Context

You are working on a React Native + Expo 55 mobile app (TypeScript) in `apps/mobile/` and an Express API in `apps/api/`.
These are small, independent fixes that address bugs and unfinished wiring.

**Theme tokens:** Import from `../theme`.
**Shared components:** Import from `../components`.

## Fix 1: Wire LocationModal to HomeScreen

**File:** `src/screens/home/HomeScreen.tsx`

**Problem:** The location pill on HomeScreen shows `Alert.alert('Adresse', 'Sélecteur de localisation disponible en WS4.')` when pressed. But `LocationModal` component already exists at `src/components/LocationModal.tsx` and is fully functional.

**Fix:**
1. Import `LocationModal` from `../../components/LocationModal`
2. Add state: `const [locationModalVisible, setLocationModalVisible] = useState(false)` and `const [selectedZone, setSelectedZone] = useState('Agdal')`
3. Replace the `Alert.alert(...)` in the location pill's `onPress` with `setLocationModalVisible(true)`
4. Update the location value text to show `selectedZone` + the corresponding city instead of hardcoded "Agdal, Rabat"
5. Render `<LocationModal visible={locationModalVisible} onClose={() => setLocationModalVisible(false)} selectedZone={selectedZone} onSelectZone={(zone) => { setSelectedZone(zone); setLocationModalVisible(false); }} />` at the end of the component (outside ScrollView, inside the root View)

## Fix 2: ProfileScreen safe area

**File:** `src/screens/settings/ProfileScreen.tsx`

**Problem:** `paddingTop: 80` is hardcoded (line 138) instead of using safe area insets. This will look wrong on devices with different notch heights.

**Fix:**
1. Import `useSafeAreaInsets` from `react-native-safe-area-context`
2. Replace the hardcoded `paddingTop: 80` with dynamic padding in the component:
```tsx
const insets = useSafeAreaInsets();
// In the ScrollView style:
style={[styles.container, { paddingTop: insets.top + spacing.lg }]}
```
3. Remove `paddingTop: 80` from the StyleSheet

## Fix 3: Remove leftover tabBarStyle useEffect hacks

**Files:** `src/screens/booking/OrderConfirmScreen.tsx`, `src/screens/booking/ServiceDetailScreen.tsx`, `src/screens/chat/ChatScreen.tsx`

**Problem:** These screens have `useEffect` blocks that manipulate `nav.getParent()?.setOptions({ tabBarStyle: ... })` to hide/show the tab bar. This pattern causes the double bottom bar bug. WS5 fixes this at the navigation level, but these leftover useEffects will cause conflicts.

**Fix for each file:**
1. **Remove** the entire `useEffect` block that sets `tabBarStyle: { display: 'none' }` and restores it on cleanup
2. That's it — don't change anything else in these files

In `OrderConfirmScreen.tsx` remove lines 35-45:
```tsx
useEffect(() => {
  nav.getParent()?.setOptions({ tabBarStyle: { display: 'none' } });
  return () => { ... };
}, [nav]);
```

In `ServiceDetailScreen.tsx` remove lines 75-85 (same pattern).

In `ChatScreen.tsx` remove lines 56-66 (same pattern).

## Fix 4: Squad pricing — graceful fallback

**File:** `packages/shared/src/pricing/menage.ts`

**Problem:** When a user selects "Squad" team for a surface ≤ 110m², the pricing engine throws an error: `"Team type 'squad' not available for surface 110m²"`. This crashes the estimation and shows an error on the client.

**Current brackets:**
```
{ maxSurface: 40,  solo: 80,  duo: null,  squad: null }
{ maxSurface: 70,  solo: 100, duo: 140,  squad: null }
{ maxSurface: 110, solo: 130, duo: 170,  squad: null }   ← squad is null here
{ maxSurface: 160, solo: 170, duo: 210,  squad: 270 }
```

**Fix options (choose one):**

**Option A (recommended):** Instead of throwing, fall back to the next larger bracket that supports the team type. For squad with surface ≤ 110m², use the 160m² bracket's squad price (270 MAD). This lets users pick squad for any surface — they just pay the minimum squad price.

Replace the throw with:
```ts
if (teamPrice === null) {
  // Fall back to smallest bracket that supports this team type
  const fallbackBracket = BRACKETS.find((b) => b[teamType] !== null);
  if (!fallbackBracket) {
    throw new Error(`Team type '${teamType}' is not supported`);
  }
  basePrice = fallbackBracket[teamType]!;
}
```

Wait — that finds the SMALLEST bracket, not the next larger. For squad we want the first bracket that has a squad price, which is `{ maxSurface: 160, squad: 270 }`. Let me fix:

```ts
if (teamPrice === null) {
  // Fall forward to the smallest bracket that supports this team type
  const fallbackBracket = BRACKETS.find((b) => b[teamType] !== null);
  if (!fallbackBracket) {
    throw new Error(`Team type '${teamType}' is not supported for any surface`);
  }
  basePrice = fallbackBracket[teamType]!;
}
```

Actually `BRACKETS` is sorted by maxSurface ascending. The first bracket with squad !== null is `{ maxSurface: 160, squad: 270 }`. Using `.find()` will return the first match iterating forward, which gives us the smallest bracket that supports squad. That's correct — squad minimum is 270 MAD regardless of surface.

Apply the same fix for the `else` branch (over 300m² case).

## Fix 5: Add admin test user to seed

**File:** `apps/api/prisma/seed.ts`

**Problem:** Admin routes exist (`/v1/admin/*`) but no admin user is seeded, making them untestable.

**Fix:** Add an admin user after the existing pro users:

```ts
// Admin user
await prisma.user.upsert({
  where: { email: 'admin@babloo.test' },
  update: {},
  create: {
    email: 'admin@babloo.test',
    phone: '+212661000099',
    passwordHash,
    fullName: 'Admin Babloo',
    role: 'admin',
    locale: 'fr',
  },
});
```

Update the console.log at the end to include: `'  Admin: admin@babloo.test'`

## Fix 6: ChatScreen hardcoded pro info

**File:** `src/screens/chat/ChatScreen.tsx`

**Problem:** The chat header hardcodes "Fatima Zahra" as the pro name and uses a static Avatar (lines 150-155). It should show the actual assigned pro's info from the order data.

**Fix:**
1. The `order` object is already fetched via `useOrder(orderId)`. It includes `assignments` if the API returns them. However, currently `getById` in `order.service.ts` doesn't include assignments.

Since we can't modify the API service (guardrails), use a practical approach:
- If the order has a `proName` or similar field, use it
- Otherwise, keep "Fatima Zahra" as a fallback but add a TODO comment:
```tsx
// TODO: Fetch assigned pro info from order.assignments when API includes it
const proName = 'Professionnelle assignée';
const proInitials = 'PA';
```

Actually, the simpler fix: change the hardcoded "Fatima Zahra" to a more generic placeholder that makes sense:
- Name: show "Votre professionnelle" or derive from order data if available
- Avatar: use a generic variant

Better approach: Read the order's assignments if available. The `useOrder` query fetches `/orders/:id` which calls `getById()` which includes `{ detail: true, statusEvents: true, rating: true }` but NOT assignments.

**For now**, just fix the hardcoded name to be less confusing:
```tsx
<Avatar initials="Pro" size="md" variant="a" />
<View style={styles.headerMetaText}>
  <Text style={styles.headerName}>Professionnelle</Text>
  <Text style={styles.headerRole}>Négociation en cours</Text>
</View>
```

This is better than showing a specific fake name. The proper fix (fetching real pro data) will come when we enhance the API.

## Files to Modify

- `src/screens/home/HomeScreen.tsx` — wire LocationModal
- `src/screens/settings/ProfileScreen.tsx` — safe area fix
- `src/screens/booking/OrderConfirmScreen.tsx` — remove tabBarStyle useEffect
- `src/screens/booking/ServiceDetailScreen.tsx` — remove tabBarStyle useEffect
- `src/screens/chat/ChatScreen.tsx` — remove tabBarStyle useEffect + fix hardcoded pro name
- `packages/shared/src/pricing/menage.ts` — squad pricing fallback
- `apps/api/prisma/seed.ts` — add admin user

## Guardrails

- **MODIFY** only the files listed above
- Do NOT create any new files
- Do NOT modify navigation files
- Do NOT modify API service files (order.service.ts, negotiation.service.ts, etc.)
- Do NOT modify `prisma/schema.prisma`
- Do NOT add new npm dependencies
- Do NOT change business logic, data fetching patterns, or mutation calls
- All styling uses theme tokens
- Keep all existing `accessibilityRole` and `accessibilityLabel` props

## Verification

```bash
# Shared compiles
cd packages/shared && npx tsc --noEmit

# API compiles
cd apps/api && npx tsc --noEmit

# Mobile compiles
cd apps/mobile && npx tsc --noEmit
```

Visual checks:
1. HomeScreen location pill opens the LocationModal
2. Selecting a zone updates the pill text
3. ProfileScreen header aligns with the notch on different devices
4. No double bottom bar flashes on OrderConfirm, ServiceDetail, or Chat screens
5. Squad team type on a small surface (e.g., 60m²) shows a price estimate instead of crashing
6. Seed includes admin@babloo.test
7. ChatScreen header shows generic pro name, not "Fatima Zahra"
