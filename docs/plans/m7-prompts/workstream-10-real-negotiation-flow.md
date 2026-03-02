# WS10 — Real Negotiation & Order Lifecycle

## Context

The app currently uses a `POST /v1/dev/orders/:id/simulate` endpoint to fake pro matching and assignment. The entire negotiation, price agreement, and post-acceptance lifecycle must work for real between a **client** and a **pro** using two separate devices. This workstream replaces all simulated behaviour with real logic.

## Current State (what already works)

- Chat messages: REST (`POST /v1/orders/:id/messages`) + Socket.IO (`message:send`) — fully real
- Price offers: `POST /v1/orders/:id/offers` creates validated offers (floor ≤ amount ≤ ceiling, step=5)
- Offer acceptance: `POST /v1/orders/:id/offers/:offerId/accept` locks price, transitions order `negotiating → accepted`
- Pro status transitions: `PATCH /v1/orders/:id/status` with FSM validation (`accepted → en_route → in_progress → completed`)
- Pro order listing: `GET /v1/pro/orders` returns assigned orders with pagination
- Client rating: `POST /v1/orders/:id/rating`
- Socket handlers: `offer:create`, `offer:accept`, `status:update`, `message:send` all exist in `apps/api/src/socket/handlers.ts`

## Bugs & Gaps to Fix

### BUG 1 — `GET /v1/orders/:id` blocks pro access (CRITICAL)
**File:** `apps/api/src/services/order.service.ts` function `getById()`
**Problem:** Line `if (!order || order.clientId !== userId)` rejects pro users. When the pro opens ChatScreen, `useOrder(orderId)` calls this endpoint and gets 404. This means `order` is undefined in ChatScreen → `isNegotiating` is false → NegotiationBar never renders for the pro → **pro cannot negotiate at all**.
**Fix:** Use `checkParticipant(userId, orderId)` from `negotiation.service.ts` instead of the clientId-only check. This function already handles both client and pro roles. Keep including `detail`, `statusEvents`, `rating`, and also include `assignments → professional → user` so both sides can see who's involved.

### BUG 2 — ProOrderDetailScreen skips negotiation
**File:** `apps/mobile/src/screens/pro/ProOrderDetailScreen.tsx`
**Problem:** Lines 140-155: "Accepter la mission" button calls `setStatus('en_route')`. This is wrong because:
- FSM: `negotiating → accepted` is the only valid forward transition from negotiating (besides cancel)
- `accepted` happens automatically when an offer is accepted via `negotiation.service.ts acceptOffer()`
- Calling `setStatus('en_route')` from 'negotiating' would fail FSM validation
**Fix:** Remove the "Accepter la mission" → en_route button. For orders in 'negotiating' status, only show "Ouvrir le chat" (already exists at line 157-163). The flow is: pro opens chat → negotiates → one side accepts offer → order auto-transitions to 'accepted' → then pro sees "Je suis en route" button.

### BUG 3 — Pro "Décliner" cancels the entire order
**File:** `apps/mobile/src/screens/pro/ProOrderDetailScreen.tsx`
**Problem:** Lines 148-153: "Décliner" calls `setStatus('cancelled')` which cancels the entire order. The pro should only decline their assignment, not destroy the client's order.
**Fix:** Create a new API endpoint `POST /v1/pro/assignments/:assignmentId/decline` that:
1. Sets `OrderAssignment.status = 'declined'`
2. Does NOT cancel the order
3. Returns the updated assignment
Then update ProOrderDetailScreen to call this endpoint instead of cancelling the order. The "Décliner" button should only appear for orders in 'negotiating' status where the pro's assignment is 'assigned'.

### GAP 4 — Pro matching is simulated
**File:** `apps/api/src/routes/dev.routes.ts` (simulate endpoint), `apps/mobile/src/screens/booking/SearchScreen.tsx`
**Problem:** SearchScreen calls the dev simulate endpoint to assign a pro. This must be real.
**Fix:**
1. Create `apps/api/src/services/matching.service.ts` — extract the matching logic from `dev.routes.ts` (lines 47-75) into a `matchPro(order)` function that:
   - Finds available pros by skill (`isAvailable: true`, `skills: { has: order.serviceType }`)
   - Sorts by reliability desc, rating desc
   - Prefers zone match using normalized zone tokens from order.location
   - Falls back to any available pro
   - Returns the selected professional or null
2. Modify `apps/api/src/services/order.service.ts create()` — after the order is created and transitioned to 'submitted', call the matching service:
   - If a pro is found: create OrderAssignment, transition `submitted → searching → negotiating`, create StatusEvents
   - If no pro is found: leave at 'submitted' (client will see "searching" animation)
   - Return the full order with assignments included
3. Modify `apps/mobile/src/screens/booking/SearchScreen.tsx`:
   - Remove `useSimulateOrder` import and usage
   - Remove the `simulateRef` pattern
   - Instead, use `useOrder(orderId)` to poll/refetch the order status
   - Keep the searching animation (spinner, progress bar, status messages)
   - When `order.status === 'negotiating'`, extract the assigned pro from `order.assignments` and show the results phase
   - Set a 10-second timeout; if still not matched, show "searching continues..." with option to go back

### GAP 5 — Availability toggle is local-only
**File:** `apps/mobile/src/screens/pro/ProHomeScreen.tsx`, `apps/api/src/routes/pro.routes.ts`
**Problem:** The toggle at line 108 is `useState(true)` — not connected to the API.
**Fix:**
1. Add `PATCH /v1/pro/availability` endpoint to `pro.routes.ts`:
   - Accepts `{ isAvailable: boolean }`
   - Updates `Professional.isAvailable` in database
   - Returns `{ isAvailable: boolean }`
2. Add `GET /v1/pro/profile` endpoint to `pro.routes.ts`:
   - Returns the pro's Professional record (including `isAvailable`, `rating`, `totalSessions`, `reliability`)
3. Create `apps/mobile/src/services/queries/proProfile.ts` with `useProProfile()` hook
4. Create `apps/mobile/src/services/mutations/proAvailability.ts` with `useToggleAvailability()` hook
5. Update ProHomeScreen: initialize toggle from `useProProfile()` data, call `useToggleAvailability()` on toggle, show real stats from profile

### GAP 6 — ChatScreen header doesn't show counterparty name
**File:** `apps/mobile/src/screens/chat/ChatScreen.tsx`
**Problem:** Lines 139-143 hardcode "Professionnelle" as the chat partner name. When a pro views the chat, it should show the client's name. When a client views the chat, it should show the pro's name.
**Fix:** After BUG 1 is fixed, `useOrder(orderId)` will return the order with assignments and client info. Use `useAuth()` to determine the current user's role:
- If user is the client: show the assigned pro's name from `order.assignments[0].professional.user.fullName`
- If user is the pro: show the client's name (need to include `client` relation in getById response)
Add the client relation to the `getById()` query: `client: { select: { id: true, fullName: true, avatarUrl: true } }`

## File Ownership

Only modify these files:

### API files:
| File | Action |
|------|--------|
| `apps/api/src/services/order.service.ts` | Modify `getById()` to use `checkParticipant()`, modify `create()` to call matching service, include assignments+client in queries |
| `apps/api/src/services/matching.service.ts` | **CREATE** — extract matching logic from dev.routes.ts |
| `apps/api/src/routes/pro.routes.ts` | Add `PATCH /v1/pro/availability`, `GET /v1/pro/profile`, `POST /v1/pro/assignments/:id/decline` |

### Mobile files:
| File | Action |
|------|--------|
| `apps/mobile/src/screens/booking/SearchScreen.tsx` | Replace simulate with real order polling |
| `apps/mobile/src/screens/pro/ProOrderDetailScreen.tsx` | Fix "Accepter" and "Décliner" buttons |
| `apps/mobile/src/screens/pro/ProHomeScreen.tsx` | Wire availability toggle + real stats |
| `apps/mobile/src/screens/chat/ChatScreen.tsx` | Show real counterparty name in header |
| `apps/mobile/src/services/queries/proProfile.ts` | **CREATE** — `useProProfile()` hook |
| `apps/mobile/src/services/mutations/proAvailability.ts` | **CREATE** — `useToggleAvailability()` hook |
| `apps/mobile/src/services/mutations/proAssignment.ts` | **CREATE** — `useDeclineAssignment()` hook |

### DO NOT modify:
- `apps/api/src/routes/dev.routes.ts` — keep as-is for testing fallback
- `apps/api/src/services/negotiation.service.ts` — already works correctly
- `apps/api/src/socket/handlers.ts` — already works correctly
- `apps/mobile/src/components/NegotiationBar.tsx` — already works correctly
- `packages/shared/src/fsm.ts` — already correct
- Any file not listed above

## Acceptance Criteria

1. **Client flow works end-to-end without any `/dev/` endpoints:**
   - Client creates order → order auto-matched to a pro → SearchScreen shows assigned pro → navigate to OrderDetail → open Chat → see NegotiationBar → send offer → pro accepts → order becomes 'accepted'

2. **Pro flow works end-to-end:**
   - Pro sees new order in "En attente" tab → opens order detail → opens chat → sees NegotiationBar → can send/accept offers → after acceptance, can progress through en_route → in_progress → completed

3. **Pro can toggle availability** and it persists in the database

4. **Pro "Décliner" only declines the assignment**, does not cancel the order

5. **Chat shows the real counterparty name** (pro sees client name, client sees pro name)

6. **`npx tsc --noEmit --project apps/mobile/tsconfig.json` passes with zero errors**

7. **`npx tsc --noEmit --project apps/api/tsconfig.json` passes with zero errors**

## Implementation Order

1. First: API changes (matching.service.ts, order.service.ts getById fix, pro.routes.ts new endpoints)
2. Second: Mobile changes (SearchScreen, ProOrderDetailScreen, ProHomeScreen, ChatScreen)
3. Last: New hooks (proProfile.ts, proAvailability.ts, proAssignment.ts)

## Key Constraints

- The matching logic in `matching.service.ts` should be extracted from `dev.routes.ts` lines 47-75 (the `prosBySkill` query, zone matching, fallback). Do NOT duplicate — move the logic.
- `checkParticipant()` from `negotiation.service.ts` is the single source of truth for access control. Use it in `getById()`.
- The FSM in `packages/shared/src/fsm.ts` is the single source of truth for valid transitions. Do not bypass it.
- The `SearchScreen` must still show the searching animation while the order is being matched. Use `useOrder(orderId)` with `refetchInterval: 2000` to poll for status changes.
- Do NOT remove the `[DEV] Simuler la complétion` button from OrderDetailScreen — it's still useful for testing the post-acceptance flow.
