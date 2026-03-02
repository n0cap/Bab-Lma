# Workstream 5: Fix Double Bottom Navigation Bar

## Context

You are working on a React Native + Expo 55 mobile app (TypeScript) in `apps/mobile/`.
There is a **bug**: two bottom navigation bars appear on the HomeScreen and OrdersListScreen.

**Root cause:** `MainTabs.tsx` uses `createBottomTabNavigator` (which renders its own tab bar), AND the `HomeScreen.tsx` and `OrdersListScreen.tsx` each render a custom inline `bottomNav` View. The screens try to hide the RN tab bar via `useEffect` calling `nav.getParent()?.setOptions({ tabBarStyle: { display: 'none' } })`, but it doesn't work cleanly — both bars are visible.

**Theme tokens:** Import from `../theme`.

## Fix Strategy

### Step 1: Create a shared `BottomTabBar` component

Create `src/components/BottomTabBar.tsx`.

This component will be used as the `tabBar` prop in `MainTabs.tsx`, replacing React Navigation's default tab bar with our custom one that matches the prototype.

```tsx
// Props come from React Navigation's BottomTabBarProps
// But we render our own custom UI

interface BottomTabBarProps {
  state: TabNavigationState<MainTabsParamList>;
  navigation: /* BottomTabNavigation type */;
  descriptors: /* BottomTabDescriptors type */;
}
```

**Design (matching current inline implementations):**
- Container: surface bg, border-top 1px border, paddingTop 8, paddingHorizontal 6, flexDirection row
- paddingBottom: use `useSafeAreaInsets().bottom` — `Math.max(insets.bottom, spacing.sm) + 12`
- 4 items: Accueil, Commandes, Fidèles, Paramètres
- Each item: flex 1, centered, borderRadius radius.md, paddingVertical 6, minHeight 48
- Icon: placeholder `◯` text (17px, textMuted; active: navy)
- Label: 9px 700 bold, textMuted; active: navy
- Commandes badge: show count of active (non-terminal) orders, clay bg circle (15px), white 8px text, absolute positioned
- Fidèles onPress: show `Alert.alert('Fidélisation', 'Fidélisation — bientôt')`

The badge count should come from the orders query. Import and use `useOrders` from `../../services/queries/orders` and compute the active count the same way HomeScreen does.

**Tab mapping:**
- Index 0 (HomeTab) → "Accueil"
- Index 1 (OrdersTab) → "Commandes" (with badge)
- Index 2 → "Fidèles" (stub — Alert only, don't actually navigate)
- Index 3 (SettingsTab) → "Paramètres"

Wait — currently MainTabs only has 3 tabs: HomeTab, OrdersTab, SettingsTab. The "Fidèles" tab is a stub. You need to handle this:
- Keep MainTabs with 3 real tabs
- In BottomTabBar, render 4 visual items, but the "Fidèles" item is a stub that just shows a toast/alert and doesn't map to a real tab

### Step 2: Update `MainTabs.tsx`

Import the new `BottomTabBar` and pass it as the `tabBar` prop:

```tsx
<Tab.Navigator
  tabBar={(props) => <BottomTabBar {...props} />}
  screenOptions={{ headerShown: false }}
>
```

Remove the old `tabBarActiveTintColor`, `tabBarInactiveTintColor`, `tabBarStyle`, `tabBarLabelStyle` from `screenOptions` since we're rendering our own tab bar.

### Step 3: Clean up `HomeScreen.tsx`

1. **Remove** the entire inline `bottomNav` View (lines ~132-144)
2. **Remove** the `NavItem` component function (lines ~149-169)
3. **Remove** all bottom-nav-related styles from the StyleSheet: `bottomNav`, `navItem`, `navIcon`, `navIconActive`, `navLabel`, `navLabelActive`, `navBadge`, `navBadgeText`
4. **Remove** the `useEffect` that hides/shows the parent tab bar (lines ~52-62)
5. **Remove** the `useSafeAreaInsets` import if no longer used elsewhere
6. Keep everything else exactly as-is (promo card, service grid, location pill, etc.)

### Step 4: Clean up `OrdersListScreen.tsx`

1. **Remove** the entire inline `bottomNav` View (lines ~179-184)
2. **Remove** the `NavItem` component function (lines ~189-204)
3. **Remove** all bottom-nav-related styles: `bottomNav`, `navItem`, `navIcon`, `navIconActive`, `navLabel`, `navLabelActive`
4. **Remove** the `useEffect` that hides/shows the parent tab bar (lines ~64-74)
5. **Remove** `useSafeAreaInsets` import if no longer used
6. Fix the FlatList `contentContainerStyle` — remove the `paddingBottom: 120` hack (it was compensating for the inline nav). Use a reasonable `paddingBottom` like `spacing['2xl']`.

### Step 5: Clean up `OrderDetailScreen.tsx`

1. **Remove** the `useEffect` that hides/shows the parent tab bar (lines ~58-68)
2. The tab bar should already be hidden when navigating into a stack screen — React Navigation handles this automatically since OrderDetail is inside OrdersStack which is inside the OrdersTab.

Wait — actually, stack screens inside a tab STILL show the tab bar. That's by design in React Navigation. The current code hides it via useEffect. Instead, we should handle this properly:

**For screens that should NOT show the tab bar** (OrderDetail, Chat, Rating, ServiceDetail, OrderConfirm, Search, etc.): These are all inside stacks (HomeStack, OrdersStack). React Navigation shows the tab bar for all screens in a tab, including nested stack screens. The proper fix is to use `tabBarStyle: { display: 'none' }` on specific screens via navigation options, OR restructure navigation so these screens are OUTSIDE the tab navigator.

**Recommended approach for hiding tab bar on inner screens:**
In `MainTabs.tsx`, configure the tab navigator to hide the tab bar when the stack navigates beyond the root screen. Use the `tabBarStyle` option based on the current route:

```tsx
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';

function getTabBarVisibility(route: any): boolean {
  const routeName = getFocusedRouteNameFromRoute(route);
  // Only show tab bar on root screens
  const rootScreens = ['Home', 'OrdersList'];
  if (!routeName) return true; // default root screen
  return rootScreens.includes(routeName);
}
```

Then in the `Tab.Navigator`, for each `Tab.Screen`, set:
```tsx
<Tab.Screen
  name="HomeTab"
  component={HomeStack}
  options={({ route }) => ({
    tabBarLabel: 'Accueil',
    tabBarStyle: getTabBarVisibility(route) ? undefined : { display: 'none' },
  })}
/>
```

But since we're using a custom `tabBar` component, we should pass visibility info to it. The simplest way: in `BottomTabBar`, check the focused route name and return `null` if we're on a non-root screen.

```tsx
export function BottomTabBar({ state, navigation, descriptors }: BottomTabBarProps) {
  const focusedRoute = state.routes[state.index];
  const nestedRouteName = getFocusedRouteNameFromRoute(focusedRoute);

  // Hide tab bar on inner stack screens
  const rootScreens = ['Home', 'OrdersList', undefined]; // undefined = initial route
  if (nestedRouteName && !rootScreens.includes(nestedRouteName)) {
    return null;
  }

  // ... render tab bar
}
```

This replaces ALL the `useEffect` tab-bar-hiding hacks across screens.

### Step 6: Re-export from components barrel

Add `BottomTabBar` to `src/components/index.ts`.

## Files to Create
- `src/components/BottomTabBar.tsx`

## Files to Modify
- `src/navigation/MainTabs.tsx` — use custom `tabBar` prop
- `src/screens/home/HomeScreen.tsx` — remove inline bottom nav + useEffect hack
- `src/screens/orders/OrdersListScreen.tsx` — remove inline bottom nav + useEffect hack
- `src/screens/orders/OrderDetailScreen.tsx` — remove useEffect tab bar hack
- `src/components/index.ts` — add BottomTabBar export

## Guardrails

- **CREATE** only `src/components/BottomTabBar.tsx`
- **MODIFY** only the files listed above
- Do NOT modify any other screens, services, contexts, or API code
- Do NOT add new npm dependencies
- Do NOT change any business logic, data fetching, or navigation structure
- All styling uses theme tokens from `../theme`
- Keep all existing `accessibilityRole` and `accessibilityLabel` props
- Import shared components from `../components`

## Verification

```bash
cd apps/mobile && npx tsc --noEmit
```

Then visually verify:
1. HomeScreen shows ONE bottom bar with 4 items
2. OrdersListScreen shows ONE bottom bar with 4 items
3. Navigating to OrderDetail/Chat/Rating/ServiceDetail hides the tab bar
4. Tab bar reappears when going back to Home or OrdersList
5. "Fidèles" tab shows an alert
6. Badge on "Commandes" shows active order count
