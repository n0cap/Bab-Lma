# WS12 — Team Offer Logic

## Goal
Implement team-based order workflow where Team Leads negotiate first with the client, then remaining slots open for other cleaners to request to join, with the Team Lead approving/rejecting each participant.

---

## Context

### Current state
- **OrderDetail.teamType** can be `solo`, `duo`, or `squad` — this already exists in the schema
- **OrderDetail.squadSize** exists but is nullable
- **OrderAssignment** model has `isLead: Boolean` field — already in schema
- **OrderAssignment.status** enum: `assigned`, `confirmed`, `declined`
- **matching.service.ts** `matchPro()` returns a single professional and creates one assignment with `isLead: true`
- **order.service.ts** `create()` calls `matchPro()` once, creates one assignment
- There is NO concept of "Team Lead certification" in the Professional model
- There is NO concept of "open slots" or "join requests"
- Current flow: one pro auto-matched → negotiation → accepted → lifecycle

### Schema (relevant parts)
```prisma
model Professional {
  id            String   @id @default(uuid())
  userId        String   @unique
  skills        ServiceType[]
  bio           String?
  rating        Float    @default(0)
  totalSessions Int      @default(0)
  reliability   Int      @default(100)
  zones         String[]
  isAvailable   Boolean  @default(true)
  // NO teamLead field exists yet
}

model OrderAssignment {
  id             String           @id @default(uuid())
  orderId        String
  professionalId String
  isLead         Boolean          @default(false)
  status         AssignmentStatus @default(assigned)
  assignedAt     DateTime         @default(now())
  confirmedAt    DateTime?
  @@unique([orderId, professionalId])
}

model OrderDetail {
  teamType   TeamType?  // solo, duo, squad
  squadSize  Int?       // null for solo/duo
}
```

---

## Implementation

### 1. Schema migration — add Team Lead certification

**File:** `apps/api/prisma/schema.prisma`

Add to Professional model:
```prisma
isTeamLead    Boolean  @default(false)
```

This boolean flags professionals certified as Team Leads. Only `isTeamLead === true` pros can be matched as leads for `duo`/`squad` orders.

Generate migration: `npx prisma migrate dev --name add-team-lead-flag`

**File:** `apps/api/prisma/seed.ts`

Update the seed pro (`pro1@babloo.test`) to have `isTeamLead: true`.

### 2. Update matching service for team orders

**File:** `apps/api/src/services/matching.service.ts`

Modify `matchPro()`:
- If `order.detail.teamType === 'solo'` → existing behavior (any matching pro)
- If `order.detail.teamType === 'duo'` or `'squad'` → filter to `isTeamLead === true` in the query
- The matched pro gets `isLead: true` in the assignment (already happens)

### 3. Add "open slots" endpoint

**File:** `apps/api/src/routes/pro.routes.ts`

New endpoint: `GET /v1/pro/open-slots`

Returns orders where:
- `teamType` is `duo` or `squad`
- Status is `accepted` (negotiation between lead and client is done)
- The lead assignment is `confirmed`
- There are unfilled slots (total assignments < required team size: duo=2, squad=squadSize)
- The requesting pro is NOT already assigned to this order
- The requesting pro has matching skill and is available

Response: list of orders with client name, service details, location, price, team size, filled/total slots.

### 4. Add "request to join" endpoint

**File:** `apps/api/src/routes/pro.routes.ts`

New endpoint: `POST /v1/pro/orders/:orderId/join-request`

Logic:
- Verify the requesting pro has matching skill
- Verify the order has open slots
- Verify the pro isn't already assigned
- Create a new `OrderAssignment` with `isLead: false`, `status: 'assigned'` (pending approval)

### 5. Add lead approval endpoints

**File:** `apps/api/src/routes/pro.routes.ts`

New endpoints:
- `GET /v1/pro/orders/:orderId/join-requests` — list pending assignments where `isLead === false` and `status === 'assigned'` (only accessible by the lead)
- `PATCH /v1/pro/assignments/:assignmentId/approve` — lead confirms a team member (sets status to `confirmed`)
- `PATCH /v1/pro/assignments/:assignmentId/reject` — lead rejects a team member (sets status to `declined`)

Both verify the caller is the lead of the order.

### 6. Mobile — Pro sees open team slots in OffersScreen

**File:** `apps/mobile/src/screens/pro/OffersScreen.tsx` (created by WS11)

Add a second section or tab: "Équipes" (teams) — shows open team slots from `GET /v1/pro/open-slots`.

Each card shows: service type, location, team size (e.g. "2/3 membres"), price, "Rejoindre" button.

**New hook:** `apps/mobile/src/services/queries/proOpenSlots.ts`
- `useProOpenSlots()` → `GET /pro/open-slots`

**New mutation:** `apps/mobile/src/services/mutations/proJoinRequest.ts`
- `useJoinRequest()` → `POST /pro/orders/:orderId/join-request`

### 7. Mobile — Lead manages join requests

**File:** `apps/mobile/src/screens/pro/ProOrderDetailScreen.tsx`

When the logged-in pro is the lead of a team order AND the order is `accepted`:
- Show a "Membres de l'équipe" section
- List pending join requests with "Accepter" / "Refuser" buttons
- List confirmed members

**New hooks:**
- `apps/mobile/src/services/queries/proJoinRequests.ts` → `useJoinRequests(orderId)` → `GET /pro/orders/:orderId/join-requests`
- `apps/mobile/src/services/mutations/proApproveReject.ts` → `useApproveJoinRequest()`, `useRejectJoinRequest()`

---

## File ownership

| File | Action | Owner |
|------|--------|-------|
| `apps/api/prisma/schema.prisma` | MODIFY — add `isTeamLead` to Professional | WS12 |
| `apps/api/prisma/seed.ts` | MODIFY — set `isTeamLead: true` for pro1 | WS12 |
| `apps/api/src/services/matching.service.ts` | MODIFY — team lead filter | WS12 |
| `apps/api/src/routes/pro.routes.ts` | MODIFY — add open-slots, join-request, approve/reject endpoints | WS12 |
| `apps/mobile/src/services/queries/proOpenSlots.ts` | CREATE | WS12 |
| `apps/mobile/src/services/queries/proJoinRequests.ts` | CREATE | WS12 |
| `apps/mobile/src/services/mutations/proJoinRequest.ts` | CREATE | WS12 |
| `apps/mobile/src/services/mutations/proApproveReject.ts` | CREATE | WS12 |
| `apps/mobile/src/screens/pro/ProOrderDetailScreen.tsx` | MODIFY — add team members section | WS12 |

### DO NOT TOUCH
- `apps/api/src/services/order.service.ts` (WS12 only changes matching, not order creation flow)
- `apps/mobile/src/screens/pro/OffersScreen.tsx` — WS11 creates it, WS12 adds team tab ONLY IF WS11 is complete. If not, create a standalone screen.
- Client-side screens (the client doesn't see team management)
- `apps/api/src/routes/negotiation.routes.ts`
- Socket handlers

### DEPENDENCY
- **WS12 depends on WS11** for OffersScreen. If running in parallel, WS12 should create its own standalone `TeamSlotsScreen.tsx` and WS11 can integrate later.

---

## Acceptance criteria

1. `Professional.isTeamLead` field exists in schema
2. `matchPro()` filters to `isTeamLead === true` for duo/squad orders
3. `GET /v1/pro/open-slots` returns only orders with unfilled team slots
4. `POST /v1/pro/orders/:orderId/join-request` creates a non-lead assignment
5. Lead can view pending join requests via `GET /v1/pro/orders/:orderId/join-requests`
6. Lead can approve/reject via PATCH endpoints
7. Approved members get `status: 'confirmed'`, rejected get `status: 'declined'`
8. Mobile shows open team slots with "Rejoindre" button
9. Lead sees team member management in ProOrderDetailScreen
10. `npx prisma migrate dev` runs without errors
11. `npx tsc --noEmit --project apps/api/tsconfig.json` passes with zero errors
