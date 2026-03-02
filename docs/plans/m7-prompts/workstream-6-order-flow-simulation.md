# Workstream 6: Order Flow Simulation for Prototype

## Context

You are working on a monorepo with `apps/api` (Express + Prisma) and `apps/mobile` (React Native + Expo 55).

**Problem:** After a client creates an order, it stays at `submitted` status forever. The order FSM requires:
```
draft → submitted → searching → negotiating → accepted → en_route → in_progress → completed
```

But there's no mechanism to advance past `submitted` because:
1. There's no admin dashboard to trigger `submitted → searching`
2. There's no auto-matching system to assign a pro and move to `searching → negotiating`
3. Without reaching `negotiating`, the chat/negotiation feature is inaccessible
4. Without a pro completing the order, rating is inaccessible

**Solution:** Add a **dev-only simulation endpoint** that auto-advances an order through the full flow, assigning a real pro from the database. Then wire the mobile app's SearchScreen to call this endpoint after order creation.

## API Changes

### Step 1: Create dev simulation endpoint

Create `apps/api/src/routes/dev.routes.ts`:

```ts
// POST /v1/dev/orders/:id/simulate
// Advances an order from 'submitted' through to 'negotiating' with auto pro assignment
// Only available when NODE_ENV !== 'production' (safety check)
```

**What the endpoint does (in a single transaction):**

1. Verify the order exists and belongs to the requesting user
2. Verify the order is in `submitted` status
3. Find an available professional whose `skills` array contains the order's `serviceType` and who is in a matching zone. If no exact match, just pick the first available pro.
4. Transition: `submitted → searching` (create StatusEvent)
5. Create an `OrderAssignment` linking the pro to this order (isLead: true, status: 'assigned')
6. Transition: `searching → negotiating` (create StatusEvent)
7. Return the updated order with its assignments

**Important:** The `checkParticipant` function in `negotiation.service.ts` checks if a user is the client OR an assigned pro. So after this endpoint creates the assignment, both client and pro can access the chat/negotiation endpoints.

### Step 2: Register the route

In `apps/api/src/index.ts` (or wherever routes are mounted), add:

```ts
import { devRouter } from './routes/dev.routes';

// Only register in non-production
if (process.env.NODE_ENV !== 'production') {
  app.use('/v1/dev', authenticate, devRouter);
}
```

Find where routes are registered (look for `app.use('/v1/orders'` etc.) and add the dev route nearby. The route MUST be behind the `authenticate` middleware so we know which user is calling.

**IMPORTANT**: For the prototype to work on Railway (which runs in production), also allow the endpoint if a special env var `ENABLE_DEV_ROUTES=true` is set:

```ts
if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_DEV_ROUTES === 'true') {
  app.use('/v1/dev', authenticate, devRouter);
}
```

### Step 3: Add a second endpoint for completing orders

```ts
// POST /v1/dev/orders/:id/complete
// Advances an order from 'negotiating' through to 'completed'
// This simulates what a pro would do: accept → en_route → in_progress → completed
```

**What this endpoint does:**

1. Verify the order exists and is in `negotiating` or `accepted` status
2. If `negotiating`: set `finalPrice = floorPrice` (simulate accepted price), transition to `accepted`
3. Transition: `accepted → en_route` (StatusEvent)
4. Transition: `en_route → in_progress` (StatusEvent)
5. Transition: `in_progress → completed` (StatusEvent)
6. Return the updated order

This allows prototype testers to quickly complete an order and access the rating screen.

## Mobile Changes

### Step 4: Add dev API mutation

Create or update `apps/mobile/src/services/mutations/dev.ts`:

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';

export function useSimulateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: string) => {
      const res = await api.post(`/dev/orders/${orderId}/simulate`);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useCompleteOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: string) => {
      const res = await api.post(`/dev/orders/${orderId}/complete`);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}
```

### Step 5: Wire SearchScreen to real order flow

Currently `SearchScreen.tsx` shows a fake animation then reveals mock pros. Update it to:

1. **Accept `orderId` as a navigation param** (passed from OrderConfirmScreen after creating the order)
2. **During the "searching" animation phase**, call the `simulate` endpoint to advance the order to `negotiating` status and assign a pro
3. **In the "results" phase**, show the REAL assigned pro (from the simulate response), not just mock data
4. **On pro card press**, instead of opening the mock ProSelectionModal, navigate to `OrderDetail` for this order (where the "Négocier" button will now appear since order is in `negotiating` status)

**Navigation param updates:**

In `HomeStack.tsx`, update the param list:
```ts
export type HomeStackParamList = {
  Home: undefined;
  Search: { orderId: string };
} & BookingStackParamList;
```

### Step 6: Wire OrderConfirmScreen to pass orderId to SearchScreen

In `OrderConfirmScreen.tsx`, after the `createOrder` mutation succeeds, navigate to Search with the orderId:

```ts
// After successful order creation
nav.navigate('Search', { orderId: result.id });
```

Find where the CTA button's onPress handler is and ensure the orderId is passed through.

### Step 7: Add "Complete Order" dev button to OrderDetailScreen

When an order is in `negotiating` or `accepted` status, show an additional dev-only button:

```tsx
{__DEV__ && ['negotiating', 'accepted', 'en_route', 'in_progress'].includes(order.status) && (
  <Button
    variant="outline"
    label="[DEV] Simuler la complétion"
    onPress={() => completeOrder.mutate(orderId)}
    loading={completeOrder.isPending}
  />
)}
```

This lets testers quickly complete an order to test the rating flow.

## Files to Create
- `apps/api/src/routes/dev.routes.ts`
- `apps/mobile/src/services/mutations/dev.ts`

## Files to Modify
- `apps/api/src/index.ts` (or main app file) — register dev routes
- `apps/mobile/src/screens/booking/SearchScreen.tsx` — accept orderId param, call simulate, show real pro
- `apps/mobile/src/screens/booking/OrderConfirmScreen.tsx` — pass orderId to Search navigation
- `apps/mobile/src/navigation/HomeStack.tsx` — update Search param type
- `apps/mobile/src/screens/orders/OrderDetailScreen.tsx` — add dev complete button

## Guardrails

- **CREATE** only the files listed above
- **MODIFY** only the files listed above
- Do NOT modify `packages/shared` — the FSM and types are correct as-is
- Do NOT modify existing service files (`order.service.ts`, `negotiation.service.ts`, `admin.service.ts`)
- Do NOT modify auth, pricing, or user routes
- Do NOT add new npm dependencies
- Do NOT modify `prisma/schema.prisma` — use existing models as-is
- The dev routes MUST have the production safety check (`NODE_ENV !== 'production' || ENABLE_DEV_ROUTES === 'true'`)
- All StatusEvent records must have correct `fromStatus`, `toStatus`, `actorRole`, and `actorUserId`
- Mobile changes must use theme tokens and existing shared components

## Verification

```bash
# API compiles
cd apps/api && npx tsc --noEmit

# Mobile compiles
cd apps/mobile && npx tsc --noEmit
```

Test flow:
1. Login as client1@babloo.test
2. Create a ménage order through the booking flow
3. SearchScreen should call simulate, show real assigned pro
4. Navigate to OrderDetail — order should be in `negotiating` status
5. "Négocier" button should appear, leading to Chat
6. Press [DEV] complete button
7. Order reaches `completed` — "Évaluer le service" button appears
