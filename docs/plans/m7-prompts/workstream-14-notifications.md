# WS14 — Push Notifications

## Goal
Add push notification support via Expo Notifications so users (client + pro) receive timely alerts for key events: new messages, status changes, matching offers, rating prompts, and service reminders.

---

## Context

### Current state
- **No push notification infrastructure exists** — no Expo Notifications, no FCM, no push tokens in DB
- Real-time updates are **only via Socket.IO** (live connection required)
- When the app is backgrounded or closed, users get NO notifications
- The Prisma schema has no `pushToken` field
- `apps/mobile/package.json` does NOT include `expo-notifications`
- Socket events exist for: `message:new`, `offer:new`, `offer:accepted`, `order:updated`

### Expo Notifications basics
- `expo-notifications` provides local + push notification APIs
- Expo Push Service acts as a proxy to APNs/FCM
- Push tokens are obtained via `Notifications.getExpoPushTokenAsync()`
- Server sends push via `https://exp.host/--/api/v2/push/send`
- Works with Expo Go (development) and standalone builds

### Key events to notify

| Event | Recipient | When |
|-------|-----------|------|
| New message | Other participant | Message received in order chat |
| Order status changed | Both participants | Any status transition |
| New matching offer | Pro | When auto-matched to a new order |
| Rate prompt | Client | When order status → `completed` |
| Service reminder | Pro | 1 hour before `scheduledStartAt` |

---

## Implementation

### 1. Install expo-notifications

Run in `apps/mobile/`:
```bash
npx expo install expo-notifications expo-device expo-constants
```

### 2. Schema migration — add push token

**File:** `apps/api/prisma/schema.prisma`

Add to User model:
```prisma
pushTokens    String[]  @default([])
```

Using an array because a user may have multiple devices.

Generate migration: `npx prisma migrate dev --name add-push-tokens`

### 3. Add push token registration endpoint

**File:** `apps/api/src/routes/user.routes.ts`

New endpoint: `POST /v1/users/push-token`

Body: `{ token: string, platform: 'ios' | 'android' }`

Logic:
- Validate the token format (Expo push token starts with `ExponentPushToken[`)
- Add to the user's `pushTokens` array (avoid duplicates)
- Return success

New endpoint: `DELETE /v1/users/push-token`

Body: `{ token: string }`

Logic:
- Remove the token from the user's `pushTokens` array
- Used on logout or token refresh

### 4. Create notification service

**New file:** `apps/api/src/services/notification.service.ts`

Functions:

#### `sendPushNotification(userId: string, title: string, body: string, data?: Record<string, string>)`
- Fetch user's `pushTokens` from DB
- For each token, send via Expo Push API:
  ```typescript
  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: token,
      title,
      body,
      data,
      sound: 'default',
      badge: 1,
    }),
  });
  ```
- Handle errors (invalid tokens → remove from DB)

#### `notifyNewMessage(orderId: string, senderId: string, content: string)`
- Find the other participant(s) of the order
- Send push: title = sender name, body = content (truncated to 100 chars)
- data = `{ type: 'message', orderId }`

#### `notifyStatusChange(orderId: string, fromStatus: string, toStatus: string)`
- Find all participants of the order
- Send push: title = "Commande mise à jour", body = status label in French
- data = `{ type: 'status', orderId, status: toStatus }`

#### `notifyNewOffer(orderId: string, proUserId: string)`
- Send to the assigned pro
- title = "Nouvelle mission", body = "Vous avez été assigné à une nouvelle mission"
- data = `{ type: 'offer', orderId }`

#### `notifyRatePrompt(orderId: string, clientUserId: string)`
- Send to the client
- title = "Évaluez le service", body = "Comment s'est passé votre service ?"
- data = `{ type: 'rate', orderId }`

#### `scheduleServiceReminder(orderId: string, proUserId: string, scheduledStartAt: Date)`
- Calculate reminder time: `scheduledStartAt - 1 hour`
- If reminder time is in the future, use a setTimeout or job queue
- For MVP: use a simple setTimeout (sufficient for short-lived processes)
- title = "Rappel de mission", body = "Votre mission commence dans 1 heure"
- data = `{ type: 'reminder', orderId }`

### 5. Integrate notifications into existing flows

**File:** `apps/api/src/socket/handlers.ts`

In `handleMessageSend()` — after broadcasting `message:new`:
```typescript
// Fire-and-forget push notification
notificationService.notifyNewMessage(orderId, socket.data.userId, content).catch(console.error);
```

In `handleStatusUpdate()` — after broadcasting `order:updated`:
```typescript
notificationService.notifyStatusChange(orderId, fromStatus, toStatus).catch(console.error);
if (toStatus === 'completed') {
  notificationService.notifyRatePrompt(orderId, order.clientId).catch(console.error);
}
```

**File:** `apps/api/src/services/order.service.ts`

In `create()` — after auto-matching a pro:
```typescript
notificationService.notifyNewOffer(order.id, matchedPro.userId).catch(console.error);
```

**GUARDRAIL:** All notification calls must be fire-and-forget (`.catch(console.error)`). A notification failure must NEVER block the main flow.

### 6. Mobile — register push token on login

**New file:** `apps/mobile/src/services/notifications.ts`

```typescript
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

export async function registerForPushNotifications(registerToken: (token: string) => void) {
  if (!Device.isDevice) return; // Push doesn't work on simulators

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return;

  const tokenData = await Notifications.getExpoPushTokenAsync();
  registerToken(tokenData.data);
}
```

**File:** `apps/mobile/src/contexts/AuthContext.tsx`

After successful `signIn()`, call `registerForPushNotifications()` and send the token to `POST /v1/users/push-token`.

On `signOut()`, call `DELETE /v1/users/push-token` to unregister.

**GUARDRAIL:** Do NOT modify AuthContext's core logic. Add notification registration as a side effect after auth succeeds.

### 7. Mobile — handle notification taps

**File:** `apps/mobile/src/services/notifications.ts`

Add notification response handler:
```typescript
Notifications.addNotificationResponseReceivedListener((response) => {
  const data = response.notification.request.content.data;
  // Navigate based on data.type:
  // 'message' or 'offer' → Chat screen
  // 'status' → OrderDetail screen
  // 'rate' → Rating screen
  // 'reminder' → ProOrderDetail screen
});
```

Expose a `navigationRef` from `RootNavigator` for deep linking from notification taps.

### 8. Mobile — notification mutation hook

**New file:** `apps/mobile/src/services/mutations/pushToken.ts`

```typescript
export function useRegisterPushToken() {
  return useMutation({
    mutationFn: ({ token, platform }: { token: string; platform: 'ios' | 'android' }) =>
      api.post('/users/push-token', { token, platform }),
  });
}

export function useUnregisterPushToken() {
  return useMutation({
    mutationFn: ({ token }: { token: string }) =>
      api.delete('/users/push-token', { data: { token } }),
  });
}
```

---

## File ownership

| File | Action | Owner |
|------|--------|-------|
| `apps/api/prisma/schema.prisma` | MODIFY — add `pushTokens` to User | WS14 |
| `apps/api/src/services/notification.service.ts` | CREATE | WS14 |
| `apps/api/src/routes/user.routes.ts` | MODIFY — add push-token endpoints | WS14 |
| `apps/api/src/socket/handlers.ts` | MODIFY — add fire-and-forget notification calls | WS14 |
| `apps/api/src/services/order.service.ts` | MODIFY — notify pro on new match (1 line) | WS14 |
| `apps/mobile/src/services/notifications.ts` | CREATE | WS14 |
| `apps/mobile/src/services/mutations/pushToken.ts` | CREATE | WS14 |
| `apps/mobile/src/contexts/AuthContext.tsx` | MODIFY — register/unregister push token | WS14 |
| `apps/mobile/src/navigation/RootNavigator.tsx` | MODIFY — expose navigationRef for deep links | WS14 |

### DO NOT TOUCH
- `apps/mobile/src/screens/` (no screen changes)
- `apps/mobile/src/components/` (no component changes)
- `apps/api/src/routes/negotiation.routes.ts`
- `apps/api/src/services/negotiation.service.ts`
- Pro-specific screens or navigation

### DEPENDENCY
- **WS14 depends on WS12** for the schema migration (both modify schema.prisma). If running in parallel, WS14 should add its migration independently and handle merge conflicts in schema.prisma manually.

---

## Acceptance criteria

1. `expo-notifications` is installed in `apps/mobile/`
2. `User.pushTokens` field exists in Prisma schema
3. `POST /v1/users/push-token` registers a token, `DELETE` unregisters
4. Push token is registered on login, unregistered on logout
5. New message → push notification sent to other participant
6. Status change → push notification sent to both participants
7. New match → push notification sent to assigned pro
8. Order completed → rating prompt push sent to client
9. All notification calls are fire-and-forget (never block main flow)
10. Tapping a notification navigates to the correct screen
11. `npx prisma migrate dev` runs without errors
12. `npx tsc --noEmit --project apps/api/tsconfig.json` passes with zero errors
