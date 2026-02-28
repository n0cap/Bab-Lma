# M3: Booking & Pricing Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the client-side booking flow from service selection to order creation, with pricing estimates, order listing, order detail, and cancellation — API-first, then mobile.

**Architecture:** Service-layer pattern on API (thin routes → order.service → Prisma). Mobile uses TanStack Query mutations/queries and form screens. Shared pricing engine (`computePrice`) and FSM (`isValidTransition`) are already built.

**Tech Stack:** Express 4, Prisma 6, vitest, supertest (API). Expo 55, React Navigation 7, TanStack Query 5 (mobile). Shared: Zod schemas, pricing engine, FSM.

---

### Task 1: Pricing Estimate Endpoint

**Files:**
- Create: `apps/api/src/routes/pricing.routes.ts`
- Modify: `apps/api/src/app.ts` — wire pricing routes

**Step 1: Create pricing routes**

```typescript
// apps/api/src/routes/pricing.routes.ts
import { Router, type Request, type Response, type NextFunction } from 'express';
import { pricingEstimateSchema } from '@babloo/shared';
import { computePrice } from '@babloo/shared';
import { ServiceType } from '@babloo/shared';
import { validate } from '../middleware/validate';

export const pricingRouter = Router();

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

// POST /v1/pricing/estimate (public — listed in auth middleware PUBLIC_ROUTES)
pricingRouter.post(
  '/estimate',
  validate(pricingEstimateSchema),
  asyncHandler(async (req, res) => {
    const { serviceType, ...params } = req.body;
    const result = computePrice(serviceType as ServiceType, params);
    res.json({ data: result });
  }),
);
```

**Step 2: Wire pricing routes into app.ts**

Add after the existing `app.use('/v1/users', userRouter);` line:

```typescript
import { pricingRouter } from './routes/pricing.routes';
// ...
app.use('/v1/pricing', pricingRouter);
```

**Step 3: Typecheck**

Run: `pnpm --filter @babloo/api exec tsc --noEmit`
Expected: exit 0

**Step 4: Commit**

```
feat(api): add pricing estimate endpoint
```

---

### Task 2: Order Service

**Files:**
- Create: `apps/api/src/services/order.service.ts`

**Step 1: Write order service**

```typescript
// apps/api/src/services/order.service.ts
import { prisma } from '../db';
import { computePrice, isValidTransition } from '@babloo/shared';
import { ServiceType } from '@babloo/shared';
import type { PricingParams } from '@babloo/shared';
import type { OrderStatus } from '@prisma/client';
import { AppError } from '../middleware/error.handler';

// ── types ────────────────────────────────────────────────

interface CreateOrderInput {
  serviceType: string;
  location: string;
  scheduledStartAt?: string;
  detail: Record<string, unknown>;
}

interface ListOrdersInput {
  userId: string;
  cursor?: string;
  limit: number;
}

// ── helpers ──────────────────────────────────────────────

function extractPricingParams(serviceType: string, detail: Record<string, unknown>): PricingParams {
  switch (serviceType) {
    case 'menage':
      return {
        surface: detail.surface as number,
        cleanType: detail.cleanType as string,
        teamType: detail.teamType as string,
        squadSize: detail.squadSize as number | undefined,
      } as PricingParams;
    case 'cuisine':
      return { guests: detail.guests as number } as PricingParams;
    case 'childcare':
      return {
        children: detail.children as number,
        hours: detail.hours as number,
      } as PricingParams;
    default:
      throw new AppError(400, 'VALIDATION_ERROR', `Type de service inconnu: ${serviceType}`);
  }
}

function buildDetailData(serviceType: string, detail: Record<string, unknown>) {
  switch (serviceType) {
    case 'menage':
      return {
        surface: detail.surface as number,
        cleanType: detail.cleanType as string,
        teamType: detail.teamType as string,
        squadSize: (detail.squadSize as number) ?? null,
        notes: (detail.notes as string) ?? null,
      };
    case 'cuisine':
      return {
        guests: detail.guests as number,
        dishes: (detail.dishes as string) ?? null,
      };
    case 'childcare':
      return {
        children: detail.children as number,
        hours: detail.hours as number,
        notes: (detail.notes as string) ?? null,
      };
    default:
      throw new AppError(400, 'VALIDATION_ERROR', `Type de service inconnu: ${serviceType}`);
  }
}

// ── create ───────────────────────────────────────────────

export async function create(userId: string, input: CreateOrderInput) {
  const params = extractPricingParams(input.serviceType, input.detail);
  const pricing = computePrice(input.serviceType as ServiceType, params);

  const order = await prisma.$transaction(async (tx) => {
    // 1. Create order in draft state
    const newOrder = await tx.order.create({
      data: {
        clientId: userId,
        serviceType: input.serviceType as any,
        status: 'draft',
        floorPrice: pricing.floorPrice,
        location: input.location,
        scheduledStartAt: input.scheduledStartAt ? new Date(input.scheduledStartAt) : null,
      },
    });

    // 2. Create order detail
    await tx.orderDetail.create({
      data: {
        orderId: newOrder.id,
        ...buildDetailData(input.serviceType, input.detail),
      },
    });

    // 3. StatusEvent: null → draft
    await tx.statusEvent.create({
      data: {
        orderId: newOrder.id,
        fromStatus: 'draft',
        toStatus: 'draft',
        actorUserId: userId,
        actorRole: 'client',
      },
    });

    // 4. Transition draft → submitted
    const submitted = await tx.order.update({
      where: { id: newOrder.id },
      data: { status: 'submitted' },
      include: { detail: true },
    });

    // 5. StatusEvent: draft → submitted
    await tx.statusEvent.create({
      data: {
        orderId: newOrder.id,
        fromStatus: 'draft',
        toStatus: 'submitted',
        actorUserId: userId,
        actorRole: 'client',
      },
    });

    return submitted;
  });

  return {
    ...order,
    pricing: {
      floorPrice: pricing.floorPrice,
      ceiling: pricing.ceiling,
      durationMinutes: pricing.durationMinutes,
    },
  };
}

// ── list ─────────────────────────────────────────────────

export async function list(input: ListOrdersInput) {
  const take = input.limit + 1; // fetch one extra to determine hasMore

  const orders = await prisma.order.findMany({
    where: { clientId: input.userId },
    orderBy: { createdAt: 'desc' },
    take,
    ...(input.cursor
      ? {
          cursor: { id: input.cursor },
          skip: 1, // skip the cursor itself
        }
      : {}),
    include: { detail: true },
  });

  const hasMore = orders.length > input.limit;
  const data = hasMore ? orders.slice(0, input.limit) : orders;
  const nextCursor = hasMore ? data[data.length - 1].id : undefined;

  return { data, cursor: nextCursor, hasMore };
}

// ── getById ──────────────────────────────────────────────

export async function getById(userId: string, orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      detail: true,
      statusEvents: { orderBy: { seq: 'asc' } },
    },
  });

  if (!order || order.clientId !== userId) {
    throw new AppError(404, 'NOT_FOUND', 'Commande non trouvée');
  }

  return order;
}

// ── cancel ───────────────────────────────────────────────

export async function cancel(userId: string, orderId: string, reason?: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });

  if (!order || order.clientId !== userId) {
    throw new AppError(404, 'NOT_FOUND', 'Commande non trouvée');
  }

  if (!isValidTransition(order.status as any, 'cancelled' as any)) {
    throw new AppError(409, 'INVALID_TRANSITION', 'Cette commande ne peut pas être annulée');
  }

  const updated = await prisma.$transaction(async (tx) => {
    const cancelled = await tx.order.update({
      where: { id: orderId },
      data: { status: 'cancelled' },
      include: { detail: true },
    });

    await tx.statusEvent.create({
      data: {
        orderId,
        fromStatus: order.status,
        toStatus: 'cancelled',
        actorUserId: userId,
        actorRole: 'client',
        reason: reason ?? null,
      },
    });

    return cancelled;
  });

  return updated;
}
```

**Step 2: Typecheck**

Run: `pnpm --filter @babloo/api exec tsc --noEmit`
Expected: exit 0

**Step 3: Commit**

```
feat(api): add order service with create, list, getById, and cancel
```

---

### Task 3: Order Routes

**Files:**
- Create: `apps/api/src/routes/order.routes.ts`
- Modify: `apps/api/src/app.ts` — wire order routes

**Step 1: Create order routes**

```typescript
// apps/api/src/routes/order.routes.ts
import { Router, type Request, type Response, type NextFunction } from 'express';
import { createOrderSchema, cancelOrderSchema } from '@babloo/shared';
import { paginationSchema, uuidParam } from '@babloo/shared';
import { validate } from '../middleware/validate';
import * as orderService from '../services/order.service';

export const orderRouter = Router();

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

// POST /v1/orders — create order
orderRouter.post(
  '/',
  validate(createOrderSchema),
  asyncHandler(async (req, res) => {
    const order = await orderService.create(req.user!.userId, req.body);
    res.status(201).json({ data: order });
  }),
);

// GET /v1/orders — list my orders (cursor-paginated)
orderRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { cursor, limit } = paginationSchema.parse(req.query);
    const result = await orderService.list({
      userId: req.user!.userId,
      cursor,
      limit,
    });
    res.json(result);
  }),
);

// GET /v1/orders/:id — get order detail
orderRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = uuidParam.parse(req.params);
    const order = await orderService.getById(req.user!.userId, id);
    res.json({ data: order });
  }),
);

// POST /v1/orders/:id/cancel — cancel order
orderRouter.post(
  '/:id/cancel',
  asyncHandler(async (req, res) => {
    const { id } = uuidParam.parse(req.params);
    const body = cancelOrderSchema.parse(req.body ?? {});
    const order = await orderService.cancel(req.user!.userId, id, body.reason);
    res.json({ data: order });
  }),
);
```

**Step 2: Wire order routes into app.ts**

Add after the pricing router line:

```typescript
import { orderRouter } from './routes/order.routes';
// ...
app.use('/v1/orders', orderRouter);
```

**Step 3: Typecheck**

Run: `pnpm --filter @babloo/api exec tsc --noEmit`
Expected: exit 0

**Step 4: Commit**

```
feat(api): add order routes (create, list, get, cancel)
```

---

### Task 4: Pricing Estimate Tests

**Files:**
- Create: `apps/api/src/__tests__/pricing.routes.test.ts`

**Step 1: Write pricing route tests**

```typescript
// apps/api/src/__tests__/pricing.routes.test.ts
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../app';

describe('POST /v1/pricing/estimate', () => {
  it('returns price for valid ménage params', async () => {
    const res = await request(app)
      .post('/v1/pricing/estimate')
      .send({ serviceType: 'menage', surface: 80, cleanType: 'simple', teamType: 'solo' });
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('floorPrice');
    expect(res.body.data).toHaveProperty('ceiling');
    expect(res.body.data).toHaveProperty('durationMinutes');
    expect(res.body.data.floorPrice).toBeGreaterThan(0);
    expect(res.body.data.ceiling).toBeGreaterThanOrEqual(res.body.data.floorPrice);
  });

  it('returns price for valid cuisine params', async () => {
    const res = await request(app)
      .post('/v1/pricing/estimate')
      .send({ serviceType: 'cuisine', guests: 6 });
    expect(res.status).toBe(200);
    expect(res.body.data.floorPrice).toBeGreaterThan(0);
  });

  it('returns price for valid childcare params', async () => {
    const res = await request(app)
      .post('/v1/pricing/estimate')
      .send({ serviceType: 'childcare', children: 2, hours: 3 });
    expect(res.status).toBe(200);
    expect(res.body.data.floorPrice).toBeGreaterThan(0);
  });

  it('rejects empty body', async () => {
    const res = await request(app).post('/v1/pricing/estimate').send({});
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects invalid service type', async () => {
    const res = await request(app)
      .post('/v1/pricing/estimate')
      .send({ serviceType: 'plumbing', surface: 50 });
    expect(res.status).toBe(400);
  });

  it('rejects ménage with surface below minimum', async () => {
    const res = await request(app)
      .post('/v1/pricing/estimate')
      .send({ serviceType: 'menage', surface: 5, cleanType: 'simple', teamType: 'solo' });
    expect(res.status).toBe(400);
  });

  it('rejects childcare with zero children', async () => {
    const res = await request(app)
      .post('/v1/pricing/estimate')
      .send({ serviceType: 'childcare', children: 0, hours: 2 });
    expect(res.status).toBe(400);
  });

  it('is accessible without auth token (public endpoint)', async () => {
    const res = await request(app)
      .post('/v1/pricing/estimate')
      .send({ serviceType: 'cuisine', guests: 4 });
    // Should NOT return 401 — this is a public endpoint
    expect(res.status).not.toBe(401);
  });
});
```

**Step 2: Run tests**

Run: `pnpm --filter @babloo/api test`
Expected: all tests pass

**Step 3: Commit**

```
test(api): add pricing estimate route tests
```

---

### Task 5: Order Route Tests

**Files:**
- Create: `apps/api/src/__tests__/order.routes.test.ts`

**Step 1: Write order route validation tests**

```typescript
// apps/api/src/__tests__/order.routes.test.ts
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../app';
import { signAccessToken } from '../utils/jwt';

// Helper: generate a valid JWT for testing middleware/validation
function authHeader() {
  const token = signAccessToken({ userId: 'test-user-id', role: 'client', locale: 'fr' });
  return { Authorization: `Bearer ${token}` };
}

describe('POST /v1/orders — validation', () => {
  it('rejects unauthenticated request', async () => {
    const res = await request(app).post('/v1/orders').send({});
    expect(res.status).toBe(401);
  });

  it('rejects empty body', async () => {
    const res = await request(app)
      .post('/v1/orders')
      .set(authHeader())
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects missing detail', async () => {
    const res = await request(app)
      .post('/v1/orders')
      .set(authHeader())
      .send({ serviceType: 'menage', location: 'Casablanca' });
    expect(res.status).toBe(400);
  });

  it('rejects invalid service type', async () => {
    const res = await request(app)
      .post('/v1/orders')
      .set(authHeader())
      .send({
        serviceType: 'plumbing',
        location: 'Rabat',
        detail: { serviceType: 'plumbing', surface: 50 },
      });
    expect(res.status).toBe(400);
  });
});

describe('GET /v1/orders — auth', () => {
  it('rejects unauthenticated request', async () => {
    const res = await request(app).get('/v1/orders');
    expect(res.status).toBe(401);
  });
});

describe('GET /v1/orders/:id — validation', () => {
  it('rejects unauthenticated request', async () => {
    const res = await request(app).get('/v1/orders/550e8400-e29b-41d4-a716-446655440000');
    expect(res.status).toBe(401);
  });

  it('rejects non-UUID id', async () => {
    const res = await request(app)
      .get('/v1/orders/not-a-uuid')
      .set(authHeader());
    expect(res.status).toBe(400);
  });
});

describe('POST /v1/orders/:id/cancel — validation', () => {
  it('rejects unauthenticated request', async () => {
    const res = await request(app)
      .post('/v1/orders/550e8400-e29b-41d4-a716-446655440000/cancel')
      .send({});
    expect(res.status).toBe(401);
  });

  it('rejects non-UUID id', async () => {
    const res = await request(app)
      .post('/v1/orders/not-a-uuid/cancel')
      .set(authHeader())
      .send({});
    expect(res.status).toBe(400);
  });
});
```

**Step 2: Run all tests**

Run: `pnpm --filter @babloo/api test`
Expected: all tests pass (pricing + order + auth)

**Step 3: Run shared tests for regression check**

Run: `pnpm --filter @babloo/shared test`
Expected: 55/55 pass

**Step 4: Commit**

```
test(api): add order route validation and auth tests
```

---

### Task 6: Mobile Order Mutations & Queries

**Files:**
- Create: `apps/mobile/src/services/mutations/orders.ts`
- Create: `apps/mobile/src/services/queries/orders.ts`

**Step 1: Create order mutations**

```typescript
// apps/mobile/src/services/mutations/orders.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';

interface MenageDetail {
  serviceType: 'menage';
  surface: number;
  cleanType: 'simple' | 'deep';
  teamType: 'solo' | 'duo' | 'squad';
  squadSize?: number;
  notes?: string;
}

interface CuisineDetail {
  serviceType: 'cuisine';
  guests: number;
  dishes?: string;
}

interface ChildcareDetail {
  serviceType: 'childcare';
  children: number;
  hours: number;
  notes?: string;
}

type OrderDetail = MenageDetail | CuisineDetail | ChildcareDetail;

interface CreateOrderInput {
  serviceType: 'menage' | 'cuisine' | 'childcare';
  location: string;
  scheduledStartAt?: string;
  detail: OrderDetail;
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateOrderInput) => {
      const res = await api.post('/orders', input);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, reason }: { orderId: string; reason?: string }) => {
      const res = await api.post(`/orders/${orderId}/cancel`, { reason });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function usePricingEstimate() {
  return useMutation({
    mutationFn: async (params: Record<string, unknown>) => {
      const res = await api.post('/pricing/estimate', params);
      return res.data.data as { floorPrice: number; ceiling: number; durationMinutes: { min: number; max: number } };
    },
  });
}
```

**Step 2: Create order queries**

```typescript
// apps/mobile/src/services/queries/orders.ts
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { api } from '../api';

export function useOrders() {
  return useInfiniteQuery({
    queryKey: ['orders'],
    queryFn: async ({ pageParam }: { pageParam?: string }) => {
      const params = new URLSearchParams();
      if (pageParam) params.set('cursor', pageParam);
      params.set('limit', '20');
      const res = await api.get(`/orders?${params.toString()}`);
      return res.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.cursor : undefined,
  });
}

export function useOrder(orderId: string) {
  return useQuery({
    queryKey: ['orders', orderId],
    queryFn: async () => {
      const res = await api.get(`/orders/${orderId}`);
      return res.data.data;
    },
    enabled: !!orderId,
  });
}
```

**Step 3: Typecheck**

Run: `pnpm --filter @babloo/mobile exec tsc --noEmit`
Expected: exit 0

**Step 4: Commit**

```
feat(mobile): add order mutations, queries, and pricing estimate hook
```

---

### Task 7: Mobile Service Selection Screen

**Files:**
- Create: `apps/mobile/src/screens/booking/ServiceSelectionScreen.tsx`
- Create: `apps/mobile/src/navigation/BookingStack.tsx`

**Step 1: Create BookingStack navigator**

```typescript
// apps/mobile/src/navigation/BookingStack.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ServiceSelectionScreen } from '../screens/booking/ServiceSelectionScreen';

export type BookingStackParamList = {
  ServiceSelection: undefined;
  ServiceDetail: { serviceType: 'menage' | 'cuisine' | 'childcare' };
  OrderConfirm: {
    serviceType: 'menage' | 'cuisine' | 'childcare';
    detail: Record<string, unknown>;
    estimate: { floorPrice: number; ceiling: number; durationMinutes: { min: number; max: number } };
  };
};

const Stack = createNativeStackNavigator<BookingStackParamList>();

export function BookingStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ServiceSelection" component={ServiceSelectionScreen} />
    </Stack.Navigator>
  );
}
```

**Step 2: Create ServiceSelectionScreen**

```typescript
// apps/mobile/src/screens/booking/ServiceSelectionScreen.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BookingStackParamList } from '../../navigation/BookingStack';
import { colors, textStyles, spacing } from '../../theme';

type Nav = NativeStackNavigationProp<BookingStackParamList>;

const SERVICES = [
  { key: 'menage' as const, label: 'Ménage', desc: 'Nettoyage et entretien' },
  { key: 'cuisine' as const, label: 'Cuisine', desc: 'Préparation de repas' },
  { key: 'childcare' as const, label: 'Garde d\'enfants', desc: 'Baby-sitting à domicile' },
];

export function ServiceSelectionScreen() {
  const nav = useNavigation<Nav>();

  return (
    <View style={styles.container}>
      <Text style={[textStyles.h1, { color: colors.navy, marginBottom: spacing.xl }]}>
        Choisissez un service
      </Text>

      {SERVICES.map((svc) => (
        <TouchableOpacity
          key={svc.key}
          style={styles.card}
          onPress={() => nav.navigate('ServiceDetail', { serviceType: svc.key })}
        >
          <Text style={[textStyles.h2, { color: colors.navy }]}>{svc.label}</Text>
          <Text style={[textStyles.body, { color: colors.textSec, marginTop: 4 }]}>{svc.desc}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.lg,
    paddingTop: 80,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
});
```

**Step 3: Typecheck**

Run: `pnpm --filter @babloo/mobile exec tsc --noEmit`
Expected: exit 0

**Step 4: Commit**

```
feat(mobile): add service selection screen and booking stack
```

---

### Task 8: Mobile Service Detail Screen (with pricing estimate)

**Files:**
- Create: `apps/mobile/src/screens/booking/ServiceDetailScreen.tsx`
- Modify: `apps/mobile/src/navigation/BookingStack.tsx` — register screen

**Step 1: Create ServiceDetailScreen**

This screen renders a form specific to the chosen service type, calls the pricing estimate mutation on parameter change, and navigates to OrderConfirm with the detail + estimate.

```typescript
// apps/mobile/src/screens/booking/ServiceDetailScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { BookingStackParamList } from '../../navigation/BookingStack';
import { usePricingEstimate } from '../../services/mutations/orders';
import { colors, textStyles, spacing } from '../../theme';

type Nav = NativeStackNavigationProp<BookingStackParamList>;
type Route = RouteProp<BookingStackParamList, 'ServiceDetail'>;

export function ServiceDetailScreen() {
  const nav = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { serviceType } = route.params;
  const estimate = usePricingEstimate();

  // ménage state
  const [surface, setSurface] = useState('');
  const [cleanType, setCleanType] = useState<'simple' | 'deep'>('simple');
  const [teamType, setTeamType] = useState<'solo' | 'duo' | 'squad'>('solo');
  // cuisine state
  const [guests, setGuests] = useState('');
  // childcare state
  const [children, setChildren] = useState('');
  const [hours, setHours] = useState('');

  // Build params for estimate
  const getParams = (): Record<string, unknown> | null => {
    switch (serviceType) {
      case 'menage': {
        const s = parseInt(surface, 10);
        if (!s || s < 20) return null;
        return { serviceType, surface: s, cleanType, teamType };
      }
      case 'cuisine': {
        const g = parseInt(guests, 10);
        if (!g || g < 1) return null;
        return { serviceType, guests: g };
      }
      case 'childcare': {
        const c = parseInt(children, 10);
        const h = parseInt(hours, 10);
        if (!c || c < 1 || !h || h < 1) return null;
        return { serviceType, children: c, hours: h };
      }
      default:
        return null;
    }
  };

  // Auto-fetch estimate when params change
  useEffect(() => {
    const params = getParams();
    if (params) {
      estimate.mutate(params);
    }
  }, [surface, cleanType, teamType, guests, children, hours]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleContinue = () => {
    const params = getParams();
    if (!params || !estimate.data) return;

    const { serviceType: _st, ...detail } = params;
    nav.navigate('OrderConfirm', {
      serviceType,
      detail: { serviceType, ...detail },
      estimate: estimate.data,
    });
  };

  const renderForm = () => {
    switch (serviceType) {
      case 'menage':
        return (
          <>
            <Text style={styles.label}>Surface (m²)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 80"
              placeholderTextColor={colors.textMuted}
              value={surface}
              onChangeText={setSurface}
              keyboardType="number-pad"
            />
            <Text style={styles.label}>Type de nettoyage</Text>
            <View style={styles.row}>
              {(['simple', 'deep'] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.chip, cleanType === t && styles.chipActive]}
                  onPress={() => setCleanType(t)}
                >
                  <Text style={[styles.chipText, cleanType === t && styles.chipTextActive]}>
                    {t === 'simple' ? 'Simple' : 'En profondeur'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.label}>Équipe</Text>
            <View style={styles.row}>
              {(['solo', 'duo', 'squad'] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.chip, teamType === t && styles.chipActive]}
                  onPress={() => setTeamType(t)}
                >
                  <Text style={[styles.chipText, teamType === t && styles.chipTextActive]}>
                    {t === 'solo' ? 'Solo' : t === 'duo' ? 'Duo' : 'Équipe'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        );
      case 'cuisine':
        return (
          <>
            <Text style={styles.label}>Nombre de convives</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 6"
              placeholderTextColor={colors.textMuted}
              value={guests}
              onChangeText={setGuests}
              keyboardType="number-pad"
            />
          </>
        );
      case 'childcare':
        return (
          <>
            <Text style={styles.label}>Nombre d'enfants</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 2"
              placeholderTextColor={colors.textMuted}
              value={children}
              onChangeText={setChildren}
              keyboardType="number-pad"
            />
            <Text style={styles.label}>Durée (heures)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 3"
              placeholderTextColor={colors.textMuted}
              value={hours}
              onChangeText={setHours}
              keyboardType="number-pad"
            />
          </>
        );
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.back}>
          <Text style={[textStyles.body, { color: colors.navy }]}>← Retour</Text>
        </TouchableOpacity>

        <Text style={[textStyles.h1, { color: colors.navy, marginBottom: spacing.lg }]}>
          {serviceType === 'menage' ? 'Ménage' : serviceType === 'cuisine' ? 'Cuisine' : 'Garde d\'enfants'}
        </Text>

        {renderForm()}

        {/* Price estimate */}
        {estimate.data && (
          <View style={styles.estimateBox}>
            <Text style={[textStyles.h3, { color: colors.navy }]}>Estimation</Text>
            <Text style={[textStyles.h2, { color: colors.clay, marginTop: 4 }]}>
              {estimate.data.floorPrice} — {estimate.data.ceiling} MAD
            </Text>
            <Text style={[textStyles.body, { color: colors.textSec, marginTop: 2 }]}>
              Durée: {estimate.data.durationMinutes.min}–{estimate.data.durationMinutes.max} min
            </Text>
          </View>
        )}

        {estimate.isPending && (
          <ActivityIndicator color={colors.navy} style={{ marginTop: spacing.md }} />
        )}

        <TouchableOpacity
          style={[styles.btn, (!getParams() || !estimate.data) && styles.btnDisabled]}
          onPress={handleContinue}
          disabled={!getParams() || !estimate.data}
        >
          <Text style={styles.btnText}>Continuer</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.lg,
    paddingTop: 80,
  },
  back: { marginBottom: spacing.xl },
  label: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 13,
    color: colors.navy,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    color: colors.textPrimary,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  chipText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 13,
    color: colors.textPrimary,
  },
  chipTextActive: {
    color: colors.white,
  },
  estimateBox: {
    backgroundColor: colors.clayTint,
    borderRadius: 14,
    padding: spacing.lg,
    marginTop: spacing.lg,
  },
  btn: {
    backgroundColor: colors.navy,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  btnDisabled: { opacity: 0.4 },
  btnText: {
    color: colors.white,
    fontFamily: 'DMSans_700Bold',
    fontSize: 15,
  },
});
```

**Step 2: Register in BookingStack**

Add `ServiceDetailScreen` import and screen to BookingStack.

**Step 3: Typecheck**

Run: `pnpm --filter @babloo/mobile exec tsc --noEmit`
Expected: exit 0

**Step 4: Commit**

```
feat(mobile): add service detail screen with live pricing estimate
```

---

### Task 9: Mobile Order Confirmation Screen

**Files:**
- Create: `apps/mobile/src/screens/booking/OrderConfirmScreen.tsx`
- Modify: `apps/mobile/src/navigation/BookingStack.tsx` — register screen

**Step 1: Create OrderConfirmScreen**

Shows a summary of service type, detail parameters, estimated price, optional schedule picker, location input, and a "Confirmer" button that calls `useCreateOrder`.

On success: navigate to order detail or back to orders list.

(Full implementation follows the same pattern as ServiceDetailScreen — form with summary card, confirm button calling createOrder mutation, navigation on success.)

**Step 2: Register in BookingStack**

**Step 3: Typecheck**

Run: `pnpm --filter @babloo/mobile exec tsc --noEmit`
Expected: exit 0

**Step 4: Commit**

```
feat(mobile): add order confirmation screen
```

---

### Task 10: Mobile Orders List Screen (real data)

**Files:**
- Modify: `apps/mobile/src/screens/orders/OrdersListScreen.tsx` — replace placeholder with real data

**Step 1: Replace OrdersListScreen with real implementation**

Uses `useOrders()` infinite query, FlatList with pull-to-refresh, cursor-paginated, onEndReached loads more. Each item shows service type, status badge, price, date. Tapping navigates to order detail.

**Step 2: Typecheck**

Run: `pnpm --filter @babloo/mobile exec tsc --noEmit`
Expected: exit 0

**Step 3: Commit**

```
feat(mobile): replace orders list placeholder with real paginated data
```

---

### Task 11: Mobile Order Detail Screen

**Files:**
- Create: `apps/mobile/src/screens/orders/OrderDetailScreen.tsx`
- Modify: `apps/mobile/src/navigation/MainTabs.tsx` — add OrderDetail to orders stack

**Step 1: Create OrderDetailScreen**

Shows full order: service type, detail (surface/guests/etc.), pricing, status badge, status timeline (from statusEvents), cancel button if cancellable. Uses `useOrder(orderId)` query.

**Step 2: Wire into navigation**

Create an OrdersStack navigator wrapping OrdersListScreen and OrderDetailScreen, replace the direct screen in MainTabs.

**Step 3: Typecheck**

Run: `pnpm --filter @babloo/mobile exec tsc --noEmit`
Expected: exit 0

**Step 4: Commit**

```
feat(mobile): add order detail screen with status timeline and cancel
```

---

### Task 12: Wire Booking into HomeScreen + Navigation

**Files:**
- Modify: `apps/mobile/src/screens/home/HomeScreen.tsx` — add "Book Service" button
- Modify: `apps/mobile/src/navigation/MainTabs.tsx` — integrate BookingStack
- Modify: `apps/mobile/src/i18n/fr.json` — add booking translations

**Step 1: Update HomeScreen with booking entry point**

Add a prominent "Réserver un service" button that navigates to BookingStack.

**Step 2: Update MainTabs to support booking navigation**

Either add BookingStack as a modal overlay or use a HomeStack wrapping HomeScreen + BookingStack.

**Step 3: Add i18n translations for booking screens**

**Step 4: Typecheck**

Run: `pnpm --filter @babloo/mobile exec tsc --noEmit`
Expected: exit 0

**Step 5: Commit**

```
feat(mobile): wire booking flow into home screen and navigation
```

---

### Task 13: Final Validation

**Step 1: Run all checks**

Run each in sequence:
1. `pnpm --filter @babloo/shared test` — shared tests (55/55)
2. `pnpm --filter @babloo/api test` — API tests (auth + pricing + order)
3. `pnpm --filter @babloo/api exec tsc --noEmit` — API typecheck
4. `pnpm --filter @babloo/mobile exec tsc --noEmit` — mobile typecheck

Expected: all pass, exit 0

**Step 2: Verify diff**

Run: `git diff --stat HEAD~N..HEAD` to see the full M3 diff.

**Step 3: Report results**

Report pass/fail per command with exact output. List any blockers. M3 code-complete when all four checks pass.
