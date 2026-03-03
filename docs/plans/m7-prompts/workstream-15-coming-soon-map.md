# WS15 — Coming Soon: Map View for Offers

## Goal
Add a "Bientôt" (Coming Soon) placeholder for a map-based offer view on the pro side, where cleaners will eventually see available offers as pins with approximate locations.

---

## Context

### Current state
- No map library is installed (`react-native-maps` not in dependencies)
- Offers are listed in a flat list (WS11 creates OffersScreen)
- Order locations are stored as free-text strings (`order.location: "12 Rue Agdal, Rabat"`)
- There are no GPS coordinates in the schema

### Future vision (NOT implemented in this WS)
- Map shows approximate locations of available offers (fuzzy/area-level, not exact address)
- Pro can tap a pin to see offer details + accept
- Requires geocoding order locations to lat/lng
- Requires `react-native-maps` or similar

---

## Implementation

### 1. Add "Carte" coming soon to OffersScreen

**File:** `apps/mobile/src/screens/pro/OffersScreen.tsx` (created by WS11)

Add a toggle or tab at the top of OffersScreen:
- **"Liste"** (active by default) — shows the existing offer list
- **"Carte"** — shows a coming soon placeholder

When "Carte" is selected, render:
```tsx
<View style={styles.comingSoonWrap}>
  <Text style={styles.comingSoonIcon}>🗺️</Text>
  <Text style={styles.comingSoonTitle}>Carte des offres</Text>
  <Text style={styles.comingSoonSubtitle}>
    Bientôt, visualisez les offres sur une carte avec leur localisation approximative.
  </Text>
</View>
```

Style the placeholder centered, with muted colors, matching the app's design language.

### 2. Add a map icon/tab to the toggle

Use a simple segmented control or Chip-based toggle:
```tsx
<View style={styles.toggleRow}>
  <Pressable onPress={() => setView('list')} style={[styles.toggleBtn, view === 'list' && styles.toggleActive]}>
    <Text>Liste</Text>
  </Pressable>
  <Pressable onPress={() => setView('map')} style={[styles.toggleBtn, view === 'map' && styles.toggleActive]}>
    <Text>Carte</Text>
  </Pressable>
</View>
```

---

## File ownership

| File | Action | Owner |
|------|--------|-------|
| `apps/mobile/src/screens/pro/OffersScreen.tsx` | MODIFY — add map/list toggle + coming soon view | WS15 |

### DO NOT TOUCH
- No API changes
- No schema changes
- No new dependencies
- No geocoding
- No actual map rendering

### DEPENDENCY
- **WS15 depends on WS11** (OffersScreen created by WS11)
- If running without WS11, create a standalone placeholder screen

---

## Acceptance criteria

1. OffersScreen has a "Liste" / "Carte" toggle at the top
2. "Liste" shows existing offer list (default)
3. "Carte" shows a styled coming soon placeholder
4. No new dependencies added (no react-native-maps)
5. No API changes
6. `npx tsc --noEmit --project apps/api/tsconfig.json` passes with zero errors
