# Workstream 7: Professional (Pro) UX

## Context

You are working on a React Native + Expo 55 mobile app (TypeScript) in `apps/mobile/`.

**Problem:** When a user with `role: 'pro'` logs in, they see the exact same client UI (HomeScreen, service booking, etc.). There is no professional-specific interface. Professionals need to:
1. See incoming order assignments
2. Accept/decline assignments
3. Advance order status (en_route → in_progress → completed)
4. Chat/negotiate with clients
5. See their earnings and stats

**The API already supports all of this:**
- `GET /v1/orders` returns orders where the user is either client OR assigned pro (via the `list` function — but currently it only queries by `clientId`. This needs a small API tweak.)
- `PATCH /v1/orders/:id/status` — pro-only status advancement
- `GET/POST /v1/orders/:id/messages` — both client and pro can chat
- `GET/POST /v1/orders/:id/offers` — both can create/accept offers
- `checkParticipant()` in `negotiation.service.ts` already checks for assigned pros

**User model:** The `User` object has a `role` field: `'client' | 'pro' | 'admin'`. The `/users/me` endpoint returns this role.

**Theme tokens:** Import from `../theme`.
**Shared components:** Import from `../components` — Button, Card, BackHeader, Chip, Avatar, etc.

## Architecture Changes

### Step 1: API — Add pro order listing endpoint

The current `GET /v1/orders` only queries `clientId`. Add a separate route for pros.

Create `apps/api/src/routes/pro.routes.ts`:

```ts
// GET /v1/pro/orders — list orders assigned to this pro
// Requires user to have role 'pro' (use requireRole middleware)
```

**Implementation:**
1. Find the professional record by userId: `prisma.professional.findUnique({ where: { userId } })`
2. Find all OrderAssignment records for this professional
3. Include the related Order with detail
4. Return paginated results

Register in the main app file (wherever routes are mounted):
```ts
import { proRouter } from './routes/pro.routes';
app.use('/v1/pro', authenticate, requireRole('pro'), proRouter);
```

### Step 2: Mobile — Role-based navigation

Modify `src/navigation/RootNavigator.tsx`:

```tsx
export function RootNavigator() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) return <LoadingScreen />;

  return (
    <NavigationContainer>
      {!isAuthenticated ? (
        <AuthStack />
      ) : user?.role === 'pro' ? (
        <ProMainTabs />
      ) : (
        <MainTabs />
      )}
    </NavigationContainer>
  );
}
```

### Step 3: Create Pro navigation structure

Create `src/navigation/ProMainTabs.tsx`:

```tsx
// Bottom tab navigator with 3 tabs:
// 1. ProHomeTab → ProStack (ProHome, ProOrderDetail, Chat)
// 2. ProStatsTab → ProStatsScreen (placeholder)
// 3. ProSettingsTab → ProfileScreen (reuse existing)
```

Create `src/navigation/ProStack.tsx`:

```tsx
export type ProStackParamList = {
  ProHome: undefined;
  ProOrderDetail: { orderId: string };
  Chat: { orderId: string };
};
```

### Step 4: ProHomeScreen (`src/screens/pro/ProHomeScreen.tsx`)

**Purpose:** Shows incoming and active orders for the professional.

**Layout:**
- Header: surface bg, safe-area padded top
  - Row: Avatar (using user initials) + "Bonjour, [first name]" (h1) + availability toggle
  - Stats row: Card with 3 columns — Rating (★ 4.8), Sessions (127), Fiabilité (97%)
- Tab bar: "En attente" | "En cours" | "Terminées"
- Order list (FlatList):
  - Each order card: Card component with:
    - Service type label + status Chip
    - Client name (if available from the order) or "Client"
    - Location
    - Floor price / final price
    - Date
    - onPress: navigate to ProOrderDetail

**Data fetching:**
Create `src/services/queries/pro.ts`:
```ts
export function useProOrders() {
  return useInfiniteQuery({
    queryKey: ['pro-orders'],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams();
      if (pageParam) params.set('cursor', pageParam);
      params.set('limit', '20');
      const res = await api.get(`/pro/orders?${params.toString()}`);
      return res.data;
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.cursor : undefined,
  });
}
```

### Step 5: ProOrderDetailScreen (`src/screens/pro/ProOrderDetailScreen.tsx`)

**Purpose:** Shows order details with pro-specific actions.

**Layout:**
- BackHeader with service type title + status Chip
- Order details card: service type, surface/guests/children, location, price
- Client info section (if available)
- Status timeline (reuse same pattern as OrderDetailScreen)

**Action buttons based on status:**
- `assigned` → "Accepter la mission" (green) + "Décliner" (outline)
  - Accept: call `PATCH /v1/orders/:id/status` with `toStatus: 'en_route'` (this skips assignment confirm — for prototype simplicity)
- `negotiating` → "Ouvrir le chat" button → navigates to Chat screen
- `accepted` → "Je suis en route" button → transitions to `en_route`
- `en_route` → "Je suis arrivé(e)" → transitions to `in_progress`
- `in_progress` → "Terminer la prestation" → transitions to `completed`

**Mutations:**
Create `src/services/mutations/pro.ts`:
```ts
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, toStatus, reason }: { orderId: string; toStatus: string; reason?: string }) => {
      const res = await api.patch(`/orders/${orderId}/status`, { toStatus, reason });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pro-orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}
```

### Step 6: ProStatsScreen (`src/screens/pro/ProStatsScreen.tsx`)

**Placeholder screen:**
- Header: "Mes statistiques" (h1)
- "Statistiques détaillées — bientôt" centered text
- This is a stub for the prototype

### Step 7: Wire the Chat screen for pro usage

The existing `ChatScreen.tsx` and negotiation system already support both client and pro roles (via `checkParticipant`). The Chat screen is in `OrdersStack` but we also need it accessible from `ProStack`.

In `ProStack.tsx`, register the Chat screen:
```tsx
<Stack.Screen name="Chat" component={ChatScreen} />
```

The ChatScreen should work for both roles since it uses the same message/offer endpoints.

### Step 8: Use custom BottomTabBar for ProMainTabs

If WS5 has created a `BottomTabBar` component, reuse or adapt it for the pro tabs. If WS5 hasn't run yet, create an inline tab bar or use React Navigation's default tab bar with custom styling. The pro tab bar should have:
- Missions (house icon placeholder)
- Stats (chart icon placeholder)
- Profil (person icon placeholder)

## Files to Create

### API:
- `apps/api/src/routes/pro.routes.ts`

### Mobile:
- `src/navigation/ProMainTabs.tsx`
- `src/navigation/ProStack.tsx`
- `src/screens/pro/ProHomeScreen.tsx`
- `src/screens/pro/ProOrderDetailScreen.tsx`
- `src/screens/pro/ProStatsScreen.tsx`
- `src/services/queries/pro.ts`
- `src/services/mutations/pro.ts`

## Files to Modify
- `apps/api/src/index.ts` (or main app file) — register pro routes
- `src/navigation/RootNavigator.tsx` — role-based routing
- `src/components/index.ts` — export any new shared components if needed

## Guardrails

- **CREATE** only the files listed above
- **MODIFY** only `RootNavigator.tsx`, the API main file (for route registration), and `components/index.ts`
- Do NOT modify existing client screens (HomeScreen, OrdersListScreen, etc.)
- Do NOT modify `packages/shared` — the FSM, types, and schemas are correct
- Do NOT modify existing services (order.service.ts, negotiation.service.ts)
- Do NOT modify `prisma/schema.prisma`
- Do NOT add new npm dependencies
- The pro route MUST use `requireRole('pro')` middleware
- All styling uses theme tokens from `../theme`
- Import shared components from `../components`
- The ChatScreen MUST be reused as-is (it already supports both roles)

## Verification

```bash
# API compiles
cd apps/api && npx tsc --noEmit

# Mobile compiles
cd apps/mobile && npx tsc --noEmit
```

Test flow:
1. Login as pro1@babloo.test / password123
2. Should see ProHomeScreen (not client HomeScreen)
3. If orders have been assigned to this pro (via WS6 simulate endpoint), they should appear
4. Tap an order → ProOrderDetailScreen with status-appropriate action buttons
5. Pro can advance status: negotiating → accepted → en_route → in_progress → completed
6. Pro can open Chat for negotiating orders
7. Login as client1@babloo.test → should still see normal client UI
