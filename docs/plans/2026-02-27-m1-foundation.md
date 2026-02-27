# M1: Foundation — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Scaffold the pnpm monorepo with Expo mobile app, Express API, shared package, Prisma schema, design system atoms, and navigation shell — app launches with placeholder screens, API responds locally.

**Architecture:** pnpm workspace monorepo (`apps/api`, `apps/mobile`, `packages/shared`). Express + Socket.IO API with Prisma ORM against PostgreSQL. Expo React Native + TypeScript mobile app with React Navigation, TanStack Query, and i18n. Shared package holds types, pricing engine, zod schemas, and FSM.

**Tech Stack:** Node 20, pnpm 10, TypeScript 5, Expo SDK 55, Express 4, Socket.IO 4, Prisma 6, PostgreSQL 16, Zod, TanStack Query, React Navigation 7, i18next, expo-font (Fraunces + DM Sans).

---

## Task 1: Monorepo Scaffold

**Files:**
- Create: `pnpm-workspace.yaml`
- Create: `package.json` (root)
- Create: `tsconfig.base.json`
- Create: `.gitignore`
- Create: `.env.example`
- Create: `.npmrc`

**Step 1: Initialize root package.json and workspace config**

```bash
cd "$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
```

Create `pnpm-workspace.yaml`:
```yaml
packages:
  - "apps/*"
  - "packages/*"
```

Create root `package.json`:
```json
{
  "name": "babloo",
  "private": true,
  "scripts": {
    "dev:api": "pnpm --filter @babloo/api dev",
    "dev:mobile": "pnpm --filter @babloo/mobile start",
    "build": "pnpm -r build",
    "test": "pnpm -r test",
    "lint": "pnpm -r lint",
    "db:migrate": "pnpm --filter @babloo/api db:migrate",
    "db:seed": "pnpm --filter @babloo/api db:seed",
    "db:studio": "pnpm --filter @babloo/api db:studio"
  },
  "engines": {
    "node": ">=20",
    "pnpm": ">=10"
  }
}
```

Create `tsconfig.base.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src"
  }
}
```

Create `.npmrc`:
```
shamefully-hoist=true
```

Create `.gitignore`:
```
node_modules/
dist/
.env
.env.local
.expo/
*.tsbuildinfo
.turbo/
coverage/
*.log
.DS_Store
```

Create `.env.example`:
```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/babloo

# Auth
JWT_SECRET=change-me-in-production-min-32-chars
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=30d
BCRYPT_ROUNDS=12

# OTP
OTP_TTL_MINUTES=5
OTP_MAX_ATTEMPTS=5
OTP_RATE_LIMIT_PER_15MIN=3

# SMS (mock in dev)
SMS_PROVIDER=mock
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# Server
PORT=3000
NODE_ENV=development
CORS_ORIGINS=http://localhost:8081

# Railway (set automatically in Railway)
RAILWAY_ENVIRONMENT=
```

**Step 2: Run pnpm install at root to validate workspace**

Run: `pnpm install`
Expected: lockfile created, no errors

**Step 3: Commit**

```bash
git add pnpm-workspace.yaml package.json tsconfig.base.json .gitignore .env.example .npmrc
git commit -m "chore: scaffold pnpm monorepo root"
```

---

## Task 2: Shared Package — Types & Enums

**Files:**
- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`
- Create: `packages/shared/src/index.ts`
- Create: `packages/shared/src/types/enums.ts`
- Create: `packages/shared/src/types/models.ts`
- Create: `packages/shared/src/types/api.ts`
- Create: `packages/shared/src/types/index.ts`

**Step 1: Create shared package structure**

Create `packages/shared/package.json`:
```json
{
  "name": "@babloo/shared",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "build": "tsc",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "vitest": "^3.0.0"
  },
  "dependencies": {
    "zod": "^3.24.0"
  }
}
```

Create `packages/shared/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

**Step 2: Write enums**

Create `packages/shared/src/types/enums.ts`:
```typescript
export const UserRole = {
  CLIENT: 'client',
  PRO: 'pro',
  ADMIN: 'admin',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const Locale = {
  FR: 'fr',
  AR: 'ar',
  EN: 'en',
} as const;
export type Locale = (typeof Locale)[keyof typeof Locale];

export const ServiceType = {
  MENAGE: 'menage',
  CUISINE: 'cuisine',
  CHILDCARE: 'childcare',
} as const;
export type ServiceType = (typeof ServiceType)[keyof typeof ServiceType];

export const OrderStatus = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  SEARCHING: 'searching',
  NEGOTIATING: 'negotiating',
  ACCEPTED: 'accepted',
  EN_ROUTE: 'en_route',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const TERMINAL_STATUSES: OrderStatus[] = [
  OrderStatus.COMPLETED,
  OrderStatus.CANCELLED,
];

export const CleanType = {
  SIMPLE: 'simple',
  DEEP: 'deep',
} as const;
export type CleanType = (typeof CleanType)[keyof typeof CleanType];

export const TeamType = {
  SOLO: 'solo',
  DUO: 'duo',
  SQUAD: 'squad',
} as const;
export type TeamType = (typeof TeamType)[keyof typeof TeamType];

export const AssignmentStatus = {
  ASSIGNED: 'assigned',
  CONFIRMED: 'confirmed',
  DECLINED: 'declined',
} as const;
export type AssignmentStatus =
  (typeof AssignmentStatus)[keyof typeof AssignmentStatus];

export const OfferStatus = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
} as const;
export type OfferStatus = (typeof OfferStatus)[keyof typeof OfferStatus];

export const OtpPurpose = {
  LOGIN: 'login',
  SIGNUP: 'signup',
  RESET: 'reset',
} as const;
export type OtpPurpose = (typeof OtpPurpose)[keyof typeof OtpPurpose];

export const ActorRole = {
  CLIENT: 'client',
  PRO: 'pro',
  ADMIN: 'admin',
  SYSTEM: 'system',
} as const;
export type ActorRole = (typeof ActorRole)[keyof typeof ActorRole];
```

**Step 3: Write model types**

Create `packages/shared/src/types/models.ts`:
```typescript
import type {
  UserRole,
  Locale,
  ServiceType,
  OrderStatus,
  CleanType,
  TeamType,
  AssignmentStatus,
  OfferStatus,
  ActorRole,
} from './enums';

export interface User {
  id: string;
  email: string | null;
  phone: string | null;
  fullName: string;
  role: UserRole;
  locale: Locale;
  avatarUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Professional {
  id: string;
  userId: string;
  skills: ServiceType[];
  bio: string | null;
  rating: number;
  totalSessions: number;
  reliability: number;
  zones: string[];
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  clientId: string;
  serviceType: ServiceType;
  status: OrderStatus;
  floorPrice: number;
  finalPrice: number | null;
  tipAmount: number;
  scheduledStartAt: string | null;
  scheduledEndAt: string | null;
  location: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderDetail {
  id: string;
  orderId: string;
  // ménage
  surface: number | null;
  cleanType: CleanType | null;
  teamType: TeamType | null;
  squadSize: number | null;
  // cuisine
  guests: number | null;
  dishes: string | null;
  // childcare
  children: number | null;
  hours: number | null;
  // shared
  notes: string | null;
}

export interface OrderAssignment {
  id: string;
  orderId: string;
  professionalId: string;
  isLead: boolean;
  status: AssignmentStatus;
  assignedAt: string;
  confirmedAt: string | null;
}

export interface StatusEvent {
  id: string;
  orderId: string;
  seq: number;
  fromStatus: OrderStatus;
  toStatus: OrderStatus;
  actorUserId: string;
  actorRole: ActorRole;
  reason: string | null;
  createdAt: string;
}

export interface Message {
  id: string;
  orderId: string;
  seq: number;
  senderId: string;
  senderRole: ActorRole;
  content: string;
  clientMessageId: string | null;
  createdAt: string;
}

export interface NegotiationOffer {
  id: string;
  orderId: string;
  seq: number;
  offeredBy: string;
  amount: number;
  status: OfferStatus;
  acceptedAt: string | null;
  createdAt: string;
}

export interface Rating {
  id: string;
  orderId: string;
  clientId: string;
  stars: number;
  comment: string | null;
  createdAt: string;
}
```

**Step 4: Write API request/response types**

Create `packages/shared/src/types/api.ts`:
```typescript
export interface ApiResponse<T> {
  data: T;
}

export interface PaginatedResponse<T> {
  data: T[];
  cursor: string | null;
  hasMore: boolean;
}

export interface PollResponse {
  data: {
    statusEvents: import('./models').StatusEvent[];
    messages: import('./models').Message[];
    offers: import('./models').NegotiationOffer[];
  };
  latestSeq: number;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    fields?: Record<string, string>;
  };
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface PricingEstimate {
  floorPrice: number;
  ceiling: number;
  durationMinutes: { min: number; max: number };
}
```

**Step 5: Create barrel export**

Create `packages/shared/src/types/index.ts`:
```typescript
export * from './enums';
export * from './models';
export * from './api';
```

Create `packages/shared/src/index.ts`:
```typescript
export * from './types';
```

**Step 6: Install deps and verify build**

Run: `cd "$(git rev-parse --show-toplevel 2>/dev/null || pwd)" && pnpm install && pnpm --filter @babloo/shared build`
Expected: compiles with no errors

**Step 7: Commit**

```bash
git add packages/shared/
git commit -m "feat(shared): add TypeScript types and enums for all entities"
```

---

## Task 3: Shared Package — Pricing Engine

**Files:**
- Create: `packages/shared/src/pricing/menage.ts`
- Create: `packages/shared/src/pricing/cuisine.ts`
- Create: `packages/shared/src/pricing/childcare.ts`
- Create: `packages/shared/src/pricing/index.ts`
- Create: `packages/shared/src/pricing/types.ts`
- Test: `packages/shared/src/__tests__/pricing.test.ts`

**Step 1: Write pricing types**

Create `packages/shared/src/pricing/types.ts`:
```typescript
import type { CleanType, TeamType } from '../types/enums';

export interface MenageParams {
  surface: number;
  teamType: TeamType;
  cleanType: CleanType;
  squadSize?: number; // 3-5, only when teamType=squad
}

export interface CuisineParams {
  guests: number;
}

export interface ChildcareParams {
  children: number;
  hours: number;
}

export interface PriceResult {
  floorPrice: number;
  ceiling: number;
  durationMinutes: { min: number; max: number };
}

export const MIN_SQUAD_PAY_PER_EMPLOYEE_MAD = 100;
export const NEGOTIATION_CEILING_MULTIPLIER = 2.5;
export const NEGOTIATION_INCREMENT = 5;
```

**Step 2: Write failing tests for ménage pricing**

Create `packages/shared/src/__tests__/pricing.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { computeMenagePrice } from '../pricing/menage';
import { computeCuisinePrice } from '../pricing/cuisine';
import { computeChildcarePrice } from '../pricing/childcare';
import { computePrice } from '../pricing';
import { CleanType, TeamType, ServiceType } from '../types/enums';

describe('Ménage pricing', () => {
  // Surface bracket boundaries
  it('40m² solo simple = 80 MAD', () => {
    expect(
      computeMenagePrice({ surface: 40, teamType: 'solo', cleanType: 'simple' })
        .floorPrice,
    ).toBe(80);
  });

  it('41m² solo simple = 100 MAD (next bracket)', () => {
    expect(
      computeMenagePrice({ surface: 41, teamType: 'solo', cleanType: 'simple' })
        .floorPrice,
    ).toBe(100);
  });

  it('70m² solo simple = 100 MAD', () => {
    expect(
      computeMenagePrice({ surface: 70, teamType: 'solo', cleanType: 'simple' })
        .floorPrice,
    ).toBe(100);
  });

  it('70m² duo simple = 140 MAD', () => {
    expect(
      computeMenagePrice({ surface: 70, teamType: 'duo', cleanType: 'simple' })
        .floorPrice,
    ).toBe(140);
  });

  it('110m² solo simple = 130 MAD', () => {
    expect(
      computeMenagePrice({
        surface: 110,
        teamType: 'solo',
        cleanType: 'simple',
      }).floorPrice,
    ).toBe(130);
  });

  it('160m² squad(3) simple = 300 MAD (squad minimum pay)', () => {
    // surface-based squad price = 270, but squad min = 3 * 100 = 300
    expect(
      computeMenagePrice({
        surface: 160,
        teamType: 'squad',
        cleanType: 'simple',
        squadSize: 3,
      }).floorPrice,
    ).toBe(300);
  });

  it('220m² squad(4) simple = max(320, 400) = 400 MAD', () => {
    expect(
      computeMenagePrice({
        surface: 220,
        teamType: 'squad',
        cleanType: 'simple',
        squadSize: 4,
      }).floorPrice,
    ).toBe(400);
  });

  it('300m² squad(3) simple = 400 MAD (surface > squad min)', () => {
    // surface-based = 400, squad min = 300 → 400
    expect(
      computeMenagePrice({
        surface: 300,
        teamType: 'squad',
        cleanType: 'simple',
        squadSize: 3,
      }).floorPrice,
    ).toBe(400);
  });

  // Deep clean multiplier
  it('80m² solo deep = round(130 * 1.35) = 176 MAD', () => {
    expect(
      computeMenagePrice({ surface: 80, teamType: 'solo', cleanType: 'deep' })
        .floorPrice,
    ).toBe(176);
  });

  it('40m² solo deep = round(80 * 1.35) = 108 MAD', () => {
    expect(
      computeMenagePrice({ surface: 40, teamType: 'solo', cleanType: 'deep' })
        .floorPrice,
    ).toBe(108);
  });

  // Over 300m² surcharge
  it('350m² solo simple = 260 + ceil(50/50)*35 = 295 MAD', () => {
    expect(
      computeMenagePrice({
        surface: 350,
        teamType: 'solo',
        cleanType: 'simple',
      }).floorPrice,
    ).toBe(295);
  });

  it('400m² duo simple = 320 + ceil(100/50)*45 = 410 MAD', () => {
    expect(
      computeMenagePrice({
        surface: 400,
        teamType: 'duo',
        cleanType: 'simple',
      }).floorPrice,
    ).toBe(410);
  });

  it('500m² squad(5) simple = max(400 + ceil(200/50)*55, 5*100) = max(620,500) = 620', () => {
    expect(
      computeMenagePrice({
        surface: 500,
        teamType: 'squad',
        cleanType: 'simple',
        squadSize: 5,
      }).floorPrice,
    ).toBe(620);
  });

  // Ceiling
  it('ceiling = round(floorPrice * 2.5)', () => {
    const result = computeMenagePrice({
      surface: 100,
      teamType: 'solo',
      cleanType: 'simple',
    });
    expect(result.ceiling).toBe(Math.round(result.floorPrice * 2.5));
  });

  // Duration estimates
  it('returns duration range', () => {
    const result = computeMenagePrice({
      surface: 80,
      teamType: 'solo',
      cleanType: 'simple',
    });
    expect(result.durationMinutes.min).toBeGreaterThan(0);
    expect(result.durationMinutes.max).toBeGreaterThan(
      result.durationMinutes.min,
    );
  });
});

describe('Cuisine pricing', () => {
  it('1 guest = 100 MAD', () => {
    expect(computeCuisinePrice({ guests: 1 }).floorPrice).toBe(100);
  });

  it('4 guests = 100 MAD', () => {
    expect(computeCuisinePrice({ guests: 4 }).floorPrice).toBe(100);
  });

  it('5 guests = 130 MAD', () => {
    expect(computeCuisinePrice({ guests: 5 }).floorPrice).toBe(130);
  });

  it('7 guests = 130 MAD', () => {
    expect(computeCuisinePrice({ guests: 7 }).floorPrice).toBe(130);
  });

  it('8 guests = 165 MAD', () => {
    expect(computeCuisinePrice({ guests: 8 }).floorPrice).toBe(165);
  });

  it('10 guests = 165 MAD', () => {
    expect(computeCuisinePrice({ guests: 10 }).floorPrice).toBe(165);
  });

  it('11 guests = 165 + ceil(1/3)*25 = 190 MAD', () => {
    expect(computeCuisinePrice({ guests: 11 }).floorPrice).toBe(190);
  });

  it('13 guests = 165 + ceil(3/3)*25 = 190 MAD', () => {
    expect(computeCuisinePrice({ guests: 13 }).floorPrice).toBe(190);
  });

  it('14 guests = 165 + ceil(4/3)*25 = 215 MAD', () => {
    expect(computeCuisinePrice({ guests: 14 }).floorPrice).toBe(215);
  });

  it('20 guests = 165 + ceil(10/3)*25 = 265 MAD', () => {
    expect(computeCuisinePrice({ guests: 20 }).floorPrice).toBe(265);
  });
});

describe('Childcare pricing', () => {
  it('1 child, 1 hour = 80 MAD', () => {
    expect(
      computeChildcarePrice({ children: 1, hours: 1 }).floorPrice,
    ).toBe(80);
  });

  it('1 child, 2 hours = 80 MAD (no extra for first 2h)', () => {
    expect(
      computeChildcarePrice({ children: 1, hours: 2 }).floorPrice,
    ).toBe(80);
  });

  it('1 child, 3 hours = 80 + 1*1*25 = 105 MAD', () => {
    expect(
      computeChildcarePrice({ children: 1, hours: 3 }).floorPrice,
    ).toBe(105);
  });

  it('2 children, 4 hours = 2*80 + 2*2*25 = 260 MAD', () => {
    expect(
      computeChildcarePrice({ children: 2, hours: 4 }).floorPrice,
    ).toBe(260);
  });

  it('6 children, 12 hours = 6*80 + 6*10*25 = 1980 MAD', () => {
    expect(
      computeChildcarePrice({ children: 6, hours: 12 }).floorPrice,
    ).toBe(1980);
  });
});

describe('computePrice dispatcher', () => {
  it('dispatches menage', () => {
    const result = computePrice(ServiceType.MENAGE, {
      surface: 40,
      teamType: 'solo',
      cleanType: 'simple',
    });
    expect(result.floorPrice).toBe(80);
  });

  it('dispatches cuisine', () => {
    const result = computePrice(ServiceType.CUISINE, { guests: 4 });
    expect(result.floorPrice).toBe(100);
  });

  it('dispatches childcare', () => {
    const result = computePrice(ServiceType.CHILDCARE, {
      children: 1,
      hours: 1,
    });
    expect(result.floorPrice).toBe(80);
  });
});
```

**Step 3: Run tests to verify they fail**

Run: `cd "$(git rev-parse --show-toplevel 2>/dev/null || pwd)" && pnpm install && pnpm --filter @babloo/shared test`
Expected: FAIL — modules not found

**Step 4: Implement ménage pricing**

Create `packages/shared/src/pricing/menage.ts`:
```typescript
import type { MenageParams, PriceResult } from './types';
import { NEGOTIATION_CEILING_MULTIPLIER, MIN_SQUAD_PAY_PER_EMPLOYEE_MAD } from './types';

interface Bracket {
  maxSurface: number;
  solo: number;
  duo: number | null;
  squad: number | null;
}

const BRACKETS: Bracket[] = [
  { maxSurface: 40, solo: 80, duo: null, squad: null },
  { maxSurface: 70, solo: 100, duo: 140, squad: null },
  { maxSurface: 110, solo: 130, duo: 170, squad: null },
  { maxSurface: 160, solo: 170, duo: 210, squad: 270 },
  { maxSurface: 220, solo: 210, duo: 260, squad: 320 },
  { maxSurface: 300, solo: 260, duo: 320, squad: 400 },
];

const SURCHARGE_PER_50M2 = { solo: 35, duo: 45, squad: 55 } as const;

const DEEP_MULTIPLIER = 1.35;

interface DurationRange {
  maxSurface: number;
  base: { min: number; max: number };
}

const DURATION_RANGES: DurationRange[] = [
  { maxSurface: 50, base: { min: 90, max: 150 } },
  { maxSurface: 90, base: { min: 150, max: 210 } },
  { maxSurface: 140, base: { min: 180, max: 270 } },
  { maxSurface: 200, base: { min: 240, max: 360 } },
  { maxSurface: Infinity, base: { min: 300, max: 420 } },
];

const TEAM_DURATION_MULTIPLIER = { solo: 1.0, duo: 0.65, squad: 0.5 } as const;

export function computeMenagePrice(params: MenageParams): PriceResult {
  const { surface, teamType, cleanType, squadSize = 3 } = params;

  // Find bracket
  const bracket = BRACKETS.find((b) => surface <= b.maxSurface);

  let basePrice: number;

  if (bracket) {
    const teamPrice = bracket[teamType];
    if (teamPrice === null) {
      // Team type not available for this bracket, fall back to largest available
      throw new Error(
        `Team type '${teamType}' not available for surface ${surface}m²`,
      );
    }
    basePrice = teamPrice;
  } else {
    // Over 300m²: use 300m² base + surcharge per extra 50m² block
    const base300 = BRACKETS[BRACKETS.length - 1][teamType];
    if (base300 === null) {
      throw new Error(
        `Team type '${teamType}' not available for surface ${surface}m²`,
      );
    }
    const extraBlocks = Math.ceil((surface - 300) / 50);
    basePrice = base300 + extraBlocks * SURCHARGE_PER_50M2[teamType];
  }

  // Deep clean multiplier
  if (cleanType === 'deep') {
    basePrice = Math.round(basePrice * DEEP_MULTIPLIER);
  }

  // Squad minimum pay guarantee
  if (teamType === 'squad') {
    const squadFloor = squadSize * MIN_SQUAD_PAY_PER_EMPLOYEE_MAD;
    basePrice = Math.max(basePrice, squadFloor);
  }

  // Duration estimate
  const durRange =
    DURATION_RANGES.find((d) => surface <= d.maxSurface) ??
    DURATION_RANGES[DURATION_RANGES.length - 1];
  const multiplier = TEAM_DURATION_MULTIPLIER[teamType];

  return {
    floorPrice: basePrice,
    ceiling: Math.round(basePrice * NEGOTIATION_CEILING_MULTIPLIER),
    durationMinutes: {
      min: Math.round(durRange.base.min * multiplier),
      max: Math.round(durRange.base.max * multiplier),
    },
  };
}
```

**Step 5: Implement cuisine pricing**

Create `packages/shared/src/pricing/cuisine.ts`:
```typescript
import type { CuisineParams, PriceResult } from './types';
import { NEGOTIATION_CEILING_MULTIPLIER } from './types';

interface Bracket {
  maxGuests: number;
  price: number;
}

const BRACKETS: Bracket[] = [
  { maxGuests: 4, price: 100 },
  { maxGuests: 7, price: 130 },
  { maxGuests: 10, price: 165 },
];

const EXTRA_PER_3_GUESTS = 25;
const BASE_DURATION_MINUTES = { min: 150, max: 240 };

export function computeCuisinePrice(params: CuisineParams): PriceResult {
  const { guests } = params;

  const bracket = BRACKETS.find((b) => guests <= b.maxGuests);

  let price: number;

  if (bracket) {
    price = bracket.price;
  } else {
    // Over 10 guests
    const extraGuests = guests - 10;
    price = 165 + Math.ceil(extraGuests / 3) * EXTRA_PER_3_GUESTS;
  }

  return {
    floorPrice: price,
    ceiling: Math.round(price * NEGOTIATION_CEILING_MULTIPLIER),
    durationMinutes: BASE_DURATION_MINUTES,
  };
}
```

**Step 6: Implement childcare pricing**

Create `packages/shared/src/pricing/childcare.ts`:
```typescript
import type { ChildcareParams, PriceResult } from './types';
import { NEGOTIATION_CEILING_MULTIPLIER } from './types';

const BASE_PER_CHILD = 80;
const EXTRA_PER_CHILD_PER_HOUR = 25;
const INCLUDED_HOURS = 2;

export function computeChildcarePrice(params: ChildcareParams): PriceResult {
  const { children, hours } = params;

  const base = children * BASE_PER_CHILD;
  const extraHours = Math.max(0, hours - INCLUDED_HOURS);
  const extra = children * extraHours * EXTRA_PER_CHILD_PER_HOUR;
  const price = base + extra;

  return {
    floorPrice: price,
    ceiling: Math.round(price * NEGOTIATION_CEILING_MULTIPLIER),
    durationMinutes: { min: hours * 60, max: hours * 60 },
  };
}
```

**Step 7: Create pricing dispatcher**

Create `packages/shared/src/pricing/index.ts`:
```typescript
import { ServiceType } from '../types/enums';
import type { PriceResult, MenageParams, CuisineParams, ChildcareParams } from './types';
import { computeMenagePrice } from './menage';
import { computeCuisinePrice } from './cuisine';
import { computeChildcarePrice } from './childcare';

export type PricingParams = MenageParams | CuisineParams | ChildcareParams;

export function computePrice(
  serviceType: ServiceType,
  params: PricingParams,
): PriceResult {
  switch (serviceType) {
    case ServiceType.MENAGE:
      return computeMenagePrice(params as MenageParams);
    case ServiceType.CUISINE:
      return computeCuisinePrice(params as CuisineParams);
    case ServiceType.CHILDCARE:
      return computeChildcarePrice(params as ChildcareParams);
    default:
      throw new Error(`Unknown service type: ${serviceType}`);
  }
}

export { computeMenagePrice } from './menage';
export { computeCuisinePrice } from './cuisine';
export { computeChildcarePrice } from './childcare';
export type { PriceResult, MenageParams, CuisineParams, ChildcareParams } from './types';
export {
  MIN_SQUAD_PAY_PER_EMPLOYEE_MAD,
  NEGOTIATION_CEILING_MULTIPLIER,
  NEGOTIATION_INCREMENT,
} from './types';
```

Update `packages/shared/src/index.ts`:
```typescript
export * from './types';
export * from './pricing';
```

**Step 8: Run tests to verify they pass**

Run: `pnpm --filter @babloo/shared test`
Expected: ALL PASS (30+ tests)

**Step 9: Commit**

```bash
git add packages/shared/
git commit -m "feat(shared): add pricing engine with full test coverage"
```

---

## Task 4: Shared Package — FSM & Validation Schemas

**Files:**
- Create: `packages/shared/src/fsm.ts`
- Create: `packages/shared/src/validation/index.ts`
- Create: `packages/shared/src/validation/auth.ts`
- Create: `packages/shared/src/validation/orders.ts`
- Create: `packages/shared/src/validation/negotiation.ts`
- Create: `packages/shared/src/validation/common.ts`
- Create: `packages/shared/src/phone.ts`
- Test: `packages/shared/src/__tests__/fsm.test.ts`
- Test: `packages/shared/src/__tests__/phone.test.ts`

**Step 1: Write FSM failing tests**

Create `packages/shared/src/__tests__/fsm.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { isValidTransition, getValidNextStatuses } from '../fsm';
import { OrderStatus } from '../types/enums';

describe('Order FSM', () => {
  it('draft → submitted is valid', () => {
    expect(isValidTransition('draft', 'submitted')).toBe(true);
  });

  it('submitted → searching is valid', () => {
    expect(isValidTransition('submitted', 'searching')).toBe(true);
  });

  it('searching → negotiating is valid', () => {
    expect(isValidTransition('searching', 'negotiating')).toBe(true);
  });

  it('negotiating → accepted is valid', () => {
    expect(isValidTransition('negotiating', 'accepted')).toBe(true);
  });

  it('accepted → en_route is valid', () => {
    expect(isValidTransition('accepted', 'en_route')).toBe(true);
  });

  it('en_route → in_progress is valid', () => {
    expect(isValidTransition('en_route', 'in_progress')).toBe(true);
  });

  it('in_progress → completed is valid', () => {
    expect(isValidTransition('in_progress', 'completed')).toBe(true);
  });

  // Cancellation from any non-terminal state
  it('draft → cancelled is valid', () => {
    expect(isValidTransition('draft', 'cancelled')).toBe(true);
  });

  it('submitted → cancelled is valid', () => {
    expect(isValidTransition('submitted', 'cancelled')).toBe(true);
  });

  it('en_route → cancelled is valid', () => {
    expect(isValidTransition('en_route', 'cancelled')).toBe(true);
  });

  // Invalid transitions
  it('completed → anything is invalid (terminal)', () => {
    expect(isValidTransition('completed', 'cancelled')).toBe(false);
    expect(isValidTransition('completed', 'draft')).toBe(false);
  });

  it('cancelled → anything is invalid (terminal)', () => {
    expect(isValidTransition('cancelled', 'completed')).toBe(false);
    expect(isValidTransition('cancelled', 'draft')).toBe(false);
  });

  it('draft → accepted is invalid (skip)', () => {
    expect(isValidTransition('draft', 'accepted')).toBe(false);
  });

  it('accepted → completed is invalid (skip in_progress)', () => {
    expect(isValidTransition('accepted', 'completed')).toBe(false);
  });

  it('getValidNextStatuses for negotiating', () => {
    const next = getValidNextStatuses('negotiating');
    expect(next).toContain('accepted');
    expect(next).toContain('cancelled');
    expect(next).not.toContain('completed');
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `pnpm --filter @babloo/shared test`
Expected: FSM tests FAIL

**Step 3: Implement FSM**

Create `packages/shared/src/fsm.ts`:
```typescript
import type { OrderStatus } from './types/enums';
import { TERMINAL_STATUSES } from './types/enums';

/**
 * Forward-only transitions (excluding cancellation, handled separately).
 */
const FORWARD_TRANSITIONS: Record<string, string> = {
  draft: 'submitted',
  submitted: 'searching',
  searching: 'negotiating',
  negotiating: 'accepted',
  accepted: 'en_route',
  en_route: 'in_progress',
  in_progress: 'completed',
};

export function isValidTransition(
  from: OrderStatus,
  to: OrderStatus,
): boolean {
  // Terminal states have no outgoing transitions
  if (TERMINAL_STATUSES.includes(from)) {
    return false;
  }

  // Cancellation is valid from any non-terminal state
  if (to === 'cancelled') {
    return true;
  }

  // Forward transition must match exactly
  return FORWARD_TRANSITIONS[from] === to;
}

export function getValidNextStatuses(from: OrderStatus): OrderStatus[] {
  if (TERMINAL_STATUSES.includes(from)) {
    return [];
  }

  const next: OrderStatus[] = [];
  const forward = FORWARD_TRANSITIONS[from];
  if (forward) {
    next.push(forward as OrderStatus);
  }
  next.push('cancelled' as OrderStatus);
  return next;
}
```

**Step 4: Write phone normalization + tests**

Create `packages/shared/src/__tests__/phone.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { normalizePhone, isValidMoroccanPhone } from '../phone';

describe('Phone E.164 normalization', () => {
  it('normalizes 0661234567 → +212661234567', () => {
    expect(normalizePhone('0661234567')).toBe('+212661234567');
  });

  it('normalizes 06 61 23 45 67 (spaces) → +212661234567', () => {
    expect(normalizePhone('06 61 23 45 67')).toBe('+212661234567');
  });

  it('normalizes +212661234567 (already E.164) → +212661234567', () => {
    expect(normalizePhone('+212661234567')).toBe('+212661234567');
  });

  it('normalizes 00212661234567 → +212661234567', () => {
    expect(normalizePhone('00212661234567')).toBe('+212661234567');
  });

  it('normalizes 212661234567 → +212661234567', () => {
    expect(normalizePhone('212661234567')).toBe('+212661234567');
  });

  it('validates correct Moroccan numbers', () => {
    expect(isValidMoroccanPhone('+212661234567')).toBe(true);
    expect(isValidMoroccanPhone('+212701234567')).toBe(true);
  });

  it('rejects invalid numbers', () => {
    expect(isValidMoroccanPhone('+33612345678')).toBe(false);
    expect(isValidMoroccanPhone('123')).toBe(false);
    expect(isValidMoroccanPhone('')).toBe(false);
  });
});
```

Create `packages/shared/src/phone.ts`:
```typescript
/**
 * Normalize a Moroccan phone number to E.164 format (+212XXXXXXXXX).
 * Accepts: 0661234567, 06 61 23 45 67, +212661234567, 00212661234567, 212661234567
 */
export function normalizePhone(raw: string): string {
  // Strip all non-digit characters except leading +
  const hasPlus = raw.startsWith('+');
  const digits = raw.replace(/\D/g, '');

  if (hasPlus && digits.startsWith('212')) {
    return `+${digits}`;
  }

  if (digits.startsWith('00212')) {
    return `+${digits.slice(2)}`;
  }

  if (digits.startsWith('212') && digits.length === 12) {
    return `+${digits}`;
  }

  if (digits.startsWith('0') && digits.length === 10) {
    return `+212${digits.slice(1)}`;
  }

  // Fallback: return with + prefix
  return `+${digits}`;
}

/**
 * Validate that a normalized phone number is a valid Moroccan mobile number.
 * Expected format: +212[6-7]XXXXXXXX (12 digits total after +)
 */
export function isValidMoroccanPhone(phone: string): boolean {
  return /^\+212[67]\d{8}$/.test(phone);
}
```

**Step 5: Write validation schemas**

Create `packages/shared/src/validation/common.ts`:
```typescript
import { z } from 'zod';

export const paginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const uuidParam = z.object({
  id: z.string().uuid(),
});
```

Create `packages/shared/src/validation/auth.ts`:
```typescript
import { z } from 'zod';

export const signupSchema = z
  .object({
    email: z.string().email().max(255).optional(),
    phone: z.string().min(8).max(20).optional(),
    password: z.string().min(8).max(128).optional(),
    fullName: z.string().min(1).max(100).trim(),
  })
  .refine((data) => data.email || data.phone, {
    message: 'Email ou numéro de téléphone requis',
  })
  .refine((data) => !data.email || data.password, {
    message: 'Mot de passe requis avec l\'email',
  });

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const otpRequestSchema = z.object({
  phone: z.string().min(8).max(20),
  purpose: z.enum(['login', 'signup', 'reset']),
});

export const otpVerifySchema = z.object({
  challengeId: z.string().uuid(),
  code: z.string().length(6).regex(/^\d{6}$/),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export const updateProfileSchema = z.object({
  fullName: z.string().min(1).max(100).trim().optional(),
  locale: z.enum(['fr', 'ar', 'en']).optional(),
  avatarUrl: z.string().url().optional().nullable(),
});
```

Create `packages/shared/src/validation/orders.ts`:
```typescript
import { z } from 'zod';

export const createOrderSchema = z.object({
  serviceType: z.enum(['menage', 'cuisine', 'childcare']),
  location: z.string().min(1).max(100),
  scheduledStartAt: z.string().datetime().optional(),
  detail: z.discriminatedUnion('serviceType', [
    z.object({
      serviceType: z.literal('menage'),
      surface: z.number().int().min(20).max(1000),
      cleanType: z.enum(['simple', 'deep']),
      teamType: z.enum(['solo', 'duo', 'squad']),
      squadSize: z.number().int().min(3).max(5).optional(),
      notes: z.string().max(500).trim().optional(),
    }),
    z.object({
      serviceType: z.literal('cuisine'),
      guests: z.number().int().min(1).max(20),
      dishes: z.string().max(500).trim().optional(),
    }),
    z.object({
      serviceType: z.literal('childcare'),
      children: z.number().int().min(1).max(6),
      hours: z.number().int().min(1).max(12),
      notes: z.string().max(500).trim().optional(),
    }),
  ]),
});

export const cancelOrderSchema = z.object({
  reason: z.string().max(500).trim().optional(),
});

export const updateStatusSchema = z.object({
  toStatus: z.enum([
    'submitted',
    'searching',
    'negotiating',
    'accepted',
    'en_route',
    'in_progress',
    'completed',
    'cancelled',
  ]),
  reason: z.string().max(500).trim().optional(),
});

export const ratingSchema = z.object({
  stars: z.number().int().min(1).max(5),
  comment: z.string().max(1000).trim().optional(),
});

export const pricingEstimateSchema = z.discriminatedUnion('serviceType', [
  z.object({
    serviceType: z.literal('menage'),
    surface: z.number().int().min(20).max(1000),
    cleanType: z.enum(['simple', 'deep']),
    teamType: z.enum(['solo', 'duo', 'squad']),
    squadSize: z.number().int().min(3).max(5).optional(),
  }),
  z.object({
    serviceType: z.literal('cuisine'),
    guests: z.number().int().min(1).max(20),
  }),
  z.object({
    serviceType: z.literal('childcare'),
    children: z.number().int().min(1).max(6),
    hours: z.number().int().min(1).max(12),
  }),
]);
```

Create `packages/shared/src/validation/negotiation.ts`:
```typescript
import { z } from 'zod';

export const createOfferSchema = z.object({
  amount: z.number().int().min(1),
});

export const messageSchema = z.object({
  content: z.string().min(1).max(2000).trim(),
  clientMessageId: z.string().uuid().optional(),
});

export const pollSchema = z.object({
  sinceSeq: z.coerce.number().int().min(0).default(0),
});
```

Create `packages/shared/src/validation/index.ts`:
```typescript
export * from './auth';
export * from './orders';
export * from './negotiation';
export * from './common';
```

**Step 6: Update barrel export**

Update `packages/shared/src/index.ts`:
```typescript
export * from './types';
export * from './pricing';
export * from './fsm';
export * from './phone';
export * from './validation';
```

**Step 7: Run all tests**

Run: `pnpm --filter @babloo/shared test`
Expected: ALL PASS

**Step 8: Commit**

```bash
git add packages/shared/
git commit -m "feat(shared): add FSM, phone normalization, and zod validation schemas"
```

---

## Task 5: API — Express + Prisma Scaffold

**Files:**
- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/src/index.ts`
- Create: `apps/api/src/config.ts`
- Create: `apps/api/prisma/schema.prisma`
- Create: `apps/api/Dockerfile`
- Create: `apps/api/.env` (local, gitignored)

**Step 1: Create API package**

Create `apps/api/package.json`:
```json
{
  "name": "@babloo/api",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "vitest run",
    "test:watch": "vitest",
    "db:migrate": "prisma migrate dev",
    "db:migrate:deploy": "prisma migrate deploy",
    "db:seed": "tsx prisma/seed.ts",
    "db:studio": "prisma studio",
    "db:generate": "prisma generate"
  },
  "dependencies": {
    "@babloo/shared": "workspace:*",
    "@prisma/client": "^6.0.0",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "express": "^4.21.0",
    "express-rate-limit": "^7.5.0",
    "helmet": "^8.0.0",
    "jsonwebtoken": "^9.0.2",
    "socket.io": "^4.8.0",
    "zod": "^3.24.0"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/cors": "^2.8.17",
    "@types/express": "^5.0.0",
    "@types/jsonwebtoken": "^9.0.7",
    "prisma": "^6.0.0",
    "tsx": "^4.19.0",
    "typescript": "^5.7.0",
    "vitest": "^3.0.0"
  }
}
```

Create `apps/api/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "module": "CommonJS",
    "moduleResolution": "node",
    "esModuleInterop": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Step 2: Create config module**

Create `apps/api/src/config.ts`:
```typescript
import 'dotenv/config';

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: (process.env.NODE_ENV || 'development') === 'development',

  database: {
    url: process.env.DATABASE_URL!,
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-me',
    accessTtl: process.env.JWT_ACCESS_TTL || '15m',
    refreshTtl: process.env.JWT_REFRESH_TTL || '30d',
  },

  bcrypt: {
    rounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
  },

  otp: {
    ttlMinutes: parseInt(process.env.OTP_TTL_MINUTES || '5', 10),
    maxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS || '5', 10),
    rateLimitPer15Min: parseInt(
      process.env.OTP_RATE_LIMIT_PER_15MIN || '3',
      10,
    ),
    devBypassCode: '123456',
  },

  cors: {
    origins: (process.env.CORS_ORIGINS || 'http://localhost:8081').split(','),
  },

  rateLimit: {
    global: { windowMs: 60_000, max: 100 },
    auth: { windowMs: 60_000, max: 10 },
  },
} as const;
```

**Step 3: Create Express + Socket.IO entry point**

Create `apps/api/src/index.ts`:
```typescript
import express from 'express';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config';

const app = express();
const httpServer = createServer(app);
const io = new SocketServer(httpServer, {
  cors: {
    origin: config.cors.origins,
    credentials: true,
  },
});

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: config.cors.origins,
    credentials: true,
  }),
);
app.use(express.json({ limit: '1mb' }));
app.use(
  rateLimit({
    windowMs: config.rateLimit.global.windowMs,
    max: config.rateLimit.global.max,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

// Health check
app.get('/v1/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
httpServer.listen(config.port, () => {
  console.log(
    `[babloo-api] listening on :${config.port} (${config.nodeEnv})`,
  );
});

export { app, io, httpServer };
```

**Step 4: Create local .env file**

Create `apps/api/.env`:
```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/babloo
JWT_SECRET=dev-secret-change-me-min-32-chars-long
PORT=3000
NODE_ENV=development
CORS_ORIGINS=http://localhost:8081
```

Note: This file is gitignored. For local dev only.

**Step 5: Add dotenv dependency**

Add `dotenv` to api dependencies (add to package.json dependencies):
```json
"dotenv": "^16.4.0"
```

**Step 6: Install deps and verify server starts**

Run:
```bash
cd "$(git rev-parse --show-toplevel 2>/dev/null || pwd)" && pnpm install
```

Then start the server:
```bash
pnpm --filter @babloo/api dev
```

Verify: `curl http://localhost:3000/v1/health`
Expected: `{"status":"ok","timestamp":"..."}`

**Step 7: Commit**

```bash
git add apps/api/package.json apps/api/tsconfig.json apps/api/src/ apps/api/Dockerfile .env.example
git commit -m "feat(api): scaffold Express + Socket.IO server with health endpoint"
```

---

## Task 6: API — Prisma Schema & Migration

**Files:**
- Create: `apps/api/prisma/schema.prisma`
- Create: `apps/api/prisma/seed.ts`

**Step 1: Write Prisma schema**

Create `apps/api/prisma/schema.prisma`:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  client
  pro
  admin
}

enum Locale {
  fr
  ar
  en
}

enum ServiceType {
  menage
  cuisine
  childcare
}

enum OrderStatus {
  draft
  submitted
  searching
  negotiating
  accepted
  en_route
  in_progress
  completed
  cancelled
}

enum CleanType {
  simple
  deep
}

enum TeamType {
  solo
  duo
  squad
}

enum AssignmentStatus {
  assigned
  confirmed
  declined
}

enum OfferStatus {
  pending
  accepted
  rejected
}

enum OtpPurpose {
  login
  signup
  reset
}

enum ActorRole {
  client
  pro
  admin
  system
}

model User {
  id           String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  email        String?  @unique @db.VarChar(255)
  phone        String?  @unique @db.VarChar(20)
  passwordHash String?  @map("password_hash")
  fullName     String   @map("full_name") @db.VarChar(100)
  role         UserRole @default(client)
  locale       Locale   @default(fr)
  avatarUrl    String?  @map("avatar_url")
  isActive     Boolean  @default(true) @map("is_active")
  createdAt    DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt    DateTime @updatedAt @map("updated_at") @db.Timestamptz

  professional    Professional?
  orders          Order[]          @relation("ClientOrders")
  refreshTokens   RefreshToken[]
  statusEvents    StatusEvent[]
  messages        Message[]
  offers          NegotiationOffer[]
  ratings         Rating[]
  auditLogs       AuditLog[]

  @@map("users")
}

model Professional {
  id            String      @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId        String      @unique @map("user_id") @db.Uuid
  skills        ServiceType[]
  bio           String?
  rating        Float       @default(0)
  totalSessions Int         @default(0) @map("total_sessions")
  reliability   Float       @default(100)
  zones         String[]
  isAvailable   Boolean     @default(true) @map("is_available")
  createdAt     DateTime    @default(now()) @map("created_at") @db.Timestamptz
  updatedAt     DateTime    @updatedAt @map("updated_at") @db.Timestamptz

  user        User              @relation(fields: [userId], references: [id])
  assignments OrderAssignment[]

  @@map("professionals")
}

model Order {
  id               String      @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  clientId         String      @map("client_id") @db.Uuid
  serviceType      ServiceType @map("service_type")
  status           OrderStatus @default(draft)
  floorPrice       Int         @map("floor_price")
  finalPrice       Int?        @map("final_price")
  tipAmount        Int         @default(0) @map("tip_amount")
  scheduledStartAt DateTime?   @map("scheduled_start_at") @db.Timestamptz
  scheduledEndAt   DateTime?   @map("scheduled_end_at") @db.Timestamptz
  location         String      @db.VarChar(100)
  createdAt        DateTime    @default(now()) @map("created_at") @db.Timestamptz
  updatedAt        DateTime    @updatedAt @map("updated_at") @db.Timestamptz

  client       User               @relation("ClientOrders", fields: [clientId], references: [id])
  detail       OrderDetail?
  assignments  OrderAssignment[]
  statusEvents StatusEvent[]
  messages     Message[]
  offers       NegotiationOffer[]
  rating       Rating?

  @@map("orders")
}

model OrderDetail {
  id        String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  orderId   String    @unique @map("order_id") @db.Uuid
  // ménage
  surface   Int?
  cleanType CleanType? @map("clean_type")
  teamType  TeamType?  @map("team_type")
  squadSize Int?       @map("squad_size")
  // cuisine
  guests    Int?
  dishes    String?    @db.VarChar(500)
  // childcare
  children  Int?
  hours     Int?
  // shared
  notes     String?    @db.VarChar(500)

  order Order @relation(fields: [orderId], references: [id])

  @@map("order_details")
}

model OrderAssignment {
  id             String           @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  orderId        String           @map("order_id") @db.Uuid
  professionalId String           @map("professional_id") @db.Uuid
  isLead         Boolean          @default(false) @map("is_lead")
  status         AssignmentStatus @default(assigned)
  assignedAt     DateTime         @default(now()) @map("assigned_at") @db.Timestamptz
  confirmedAt    DateTime?        @map("confirmed_at") @db.Timestamptz

  order        Order        @relation(fields: [orderId], references: [id])
  professional Professional @relation(fields: [professionalId], references: [id])

  @@unique([orderId, professionalId])
  @@map("order_assignments")
}

model StatusEvent {
  id          String      @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  orderId     String      @map("order_id") @db.Uuid
  seq         Int         @default(autoincrement())
  fromStatus  OrderStatus @map("from_status")
  toStatus    OrderStatus @map("to_status")
  actorUserId String      @map("actor_user_id") @db.Uuid
  actorRole   ActorRole   @map("actor_role")
  reason      String?     @db.VarChar(500)
  createdAt   DateTime    @default(now()) @map("created_at") @db.Timestamptz

  order Order @relation(fields: [orderId], references: [id])
  actor User  @relation(fields: [actorUserId], references: [id])

  @@index([orderId, seq])
  @@map("status_events")
}

model Message {
  id              String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  orderId         String    @map("order_id") @db.Uuid
  seq             Int       @default(autoincrement())
  senderId        String    @map("sender_id") @db.Uuid
  senderRole      ActorRole @map("sender_role")
  content         String    @db.VarChar(2000)
  clientMessageId String?   @unique @map("client_message_id") @db.Uuid
  createdAt       DateTime  @default(now()) @map("created_at") @db.Timestamptz

  order  Order @relation(fields: [orderId], references: [id])
  sender User  @relation(fields: [senderId], references: [id])

  @@index([orderId, seq])
  @@map("messages")
}

model NegotiationOffer {
  id         String      @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  orderId    String      @map("order_id") @db.Uuid
  seq        Int         @default(autoincrement())
  offeredBy  String      @map("offered_by") @db.Uuid
  amount     Int
  status     OfferStatus @default(pending)
  acceptedAt DateTime?   @map("accepted_at") @db.Timestamptz
  createdAt  DateTime    @default(now()) @map("created_at") @db.Timestamptz

  order  Order @relation(fields: [orderId], references: [id])
  author User  @relation(fields: [offeredBy], references: [id])

  @@index([orderId, seq])
  @@map("negotiation_offers")
}

model OtpChallenge {
  id         String     @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  phone      String     @db.VarChar(20)
  purpose    OtpPurpose
  codeHash   String     @map("code_hash")
  expiresAt  DateTime   @map("expires_at") @db.Timestamptz
  attempts   Int        @default(0)
  consumedAt DateTime?  @map("consumed_at") @db.Timestamptz
  createdAt  DateTime   @default(now()) @map("created_at") @db.Timestamptz

  @@index([phone, createdAt])
  @@map("otp_challenges")
}

model RefreshToken {
  id         String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId     String   @map("user_id") @db.Uuid
  tokenHash  String   @unique @map("token_hash") @db.VarChar(64)
  family     String   @db.Uuid
  replacedBy String?  @map("replaced_by") @db.Uuid
  isRevoked  Boolean  @default(false) @map("is_revoked")
  expiresAt  DateTime @map("expires_at") @db.Timestamptz
  createdAt  DateTime @default(now()) @map("created_at") @db.Timestamptz

  user User @relation(fields: [userId], references: [id])

  @@index([family])
  @@map("refresh_tokens")
}

model Rating {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  orderId   String   @unique @map("order_id") @db.Uuid
  clientId  String   @map("client_id") @db.Uuid
  stars     Int
  comment   String?  @db.VarChar(1000)
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz

  order  Order @relation(fields: [orderId], references: [id])
  client User  @relation(fields: [clientId], references: [id])

  @@map("ratings")
}

model AuditLog {
  id          String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  action      String    @db.VarChar(100)
  entityType  String    @map("entity_type") @db.VarChar(50)
  entityId    String    @map("entity_id") @db.Uuid
  actorUserId String    @map("actor_user_id") @db.Uuid
  actorRole   ActorRole @map("actor_role")
  metadata    Json?
  createdAt   DateTime  @default(now()) @map("created_at") @db.Timestamptz

  actor User @relation(fields: [actorUserId], references: [id])

  @@index([entityType, entityId])
  @@index([actorUserId])
  @@map("audit_logs")
}

model IdempotencyKey {
  id         String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  key        String   @db.VarChar(64)
  userId     String   @map("user_id") @db.Uuid
  response   Json
  statusCode Int      @map("status_code")
  createdAt  DateTime @default(now()) @map("created_at") @db.Timestamptz

  @@unique([key, userId])
  @@map("idempotency_keys")
}
```

**Step 2: Create seed script**

Create `apps/api/prisma/seed.ts`:
```typescript
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const passwordHash = await bcrypt.hash('password123', 12);

  // Test clients
  const client1 = await prisma.user.upsert({
    where: { email: 'client1@babloo.test' },
    update: {},
    create: {
      email: 'client1@babloo.test',
      phone: '+212661000001',
      passwordHash,
      fullName: 'Yasmine Benali',
      role: 'client',
      locale: 'fr',
    },
  });

  const client2 = await prisma.user.upsert({
    where: { email: 'client2@babloo.test' },
    update: {},
    create: {
      email: 'client2@babloo.test',
      phone: '+212661000002',
      passwordHash,
      fullName: 'Karim Alaoui',
      role: 'client',
      locale: 'fr',
    },
  });

  const client3 = await prisma.user.upsert({
    where: { email: 'client3@babloo.test' },
    update: {},
    create: {
      email: 'client3@babloo.test',
      phone: '+212661000003',
      passwordHash,
      fullName: 'Nour El Idrissi',
      role: 'client',
      locale: 'fr',
    },
  });

  // Test professionals
  const proUser1 = await prisma.user.upsert({
    where: { email: 'pro1@babloo.test' },
    update: {},
    create: {
      email: 'pro1@babloo.test',
      phone: '+212661000011',
      passwordHash,
      fullName: 'Fatima Zahra',
      role: 'pro',
      locale: 'fr',
    },
  });

  const proUser2 = await prisma.user.upsert({
    where: { email: 'pro2@babloo.test' },
    update: {},
    create: {
      email: 'pro2@babloo.test',
      phone: '+212661000012',
      passwordHash,
      fullName: 'Amina Berrada',
      role: 'pro',
      locale: 'fr',
    },
  });

  const proUser3 = await prisma.user.upsert({
    where: { email: 'pro3@babloo.test' },
    update: {},
    create: {
      email: 'pro3@babloo.test',
      phone: '+212661000013',
      passwordHash,
      fullName: 'Rachid Mouline',
      role: 'pro',
      locale: 'fr',
    },
  });

  // Create Professional profiles
  await prisma.professional.upsert({
    where: { userId: proUser1.id },
    update: {},
    create: {
      userId: proUser1.id,
      skills: ['menage', 'cuisine'],
      bio: 'Professionnelle expérimentée en ménage et cuisine.',
      rating: 4.8,
      totalSessions: 127,
      reliability: 97,
      zones: ['agdal', 'hay_riad', 'hassan'],
      isAvailable: true,
    },
  });

  await prisma.professional.upsert({
    where: { userId: proUser2.id },
    update: {},
    create: {
      userId: proUser2.id,
      skills: ['menage', 'childcare'],
      bio: 'Spécialisée garde d\'enfants et ménage.',
      rating: 4.6,
      totalSessions: 89,
      reliability: 95,
      zones: ['agdal', 'sale_medina', 'tabriquet'],
      isAvailable: true,
    },
  });

  await prisma.professional.upsert({
    where: { userId: proUser3.id },
    update: {},
    create: {
      userId: proUser3.id,
      skills: ['cuisine'],
      bio: 'Chef à domicile, cuisine marocaine traditionnelle.',
      rating: 4.9,
      totalSessions: 64,
      reliability: 99,
      zones: ['agdal', 'hay_riad'],
      isAvailable: true,
    },
  });

  console.log('Seed complete.');
  console.log('Test accounts (password: password123):');
  console.log('  Clients: client1@babloo.test, client2@babloo.test, client3@babloo.test');
  console.log('  Pros: pro1@babloo.test, pro2@babloo.test, pro3@babloo.test');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

**Step 3: Create local Postgres database and run migration**

Run:
```bash
createdb babloo 2>/dev/null || true
cd "$(git rev-parse --show-toplevel 2>/dev/null || pwd)" && pnpm --filter @babloo/api db:generate
pnpm --filter @babloo/api db:migrate -- --name init
```

Expected: Migration created and applied successfully.

**Step 4: Run seed**

Run: `pnpm --filter @babloo/api db:seed`
Expected: "Seed complete." with test account info.

**Step 5: Create Dockerfile**

Create `apps/api/Dockerfile`:
```dockerfile
FROM node:20-slim AS base
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@10.8.2 --activate

WORKDIR /app

# Copy workspace config
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source
COPY packages/shared/ packages/shared/
COPY apps/api/ apps/api/

# Generate Prisma client
RUN pnpm --filter @babloo/api db:generate

# Build shared + api
RUN pnpm --filter @babloo/shared build
RUN pnpm --filter @babloo/api build

EXPOSE 3000
CMD ["sh", "-c", "pnpm --filter @babloo/api db:migrate:deploy && node apps/api/dist/index.js"]
```

**Step 6: Commit**

```bash
git add apps/api/prisma/ apps/api/Dockerfile
git commit -m "feat(api): add Prisma schema with all 13 tables and seed data"
```

---

## Task 7: Mobile — Expo Scaffold + Navigation Shell

**Files:**
- Create: `apps/mobile/` (Expo init)
- Create: `apps/mobile/src/navigation/RootNavigator.tsx`
- Create: `apps/mobile/src/navigation/AuthStack.tsx`
- Create: `apps/mobile/src/navigation/MainTabs.tsx`
- Create: `apps/mobile/src/navigation/OrderFlowStack.tsx`
- Create: `apps/mobile/src/screens/` (placeholder screens)

**Step 1: Initialize Expo project**

Run:
```bash
cd "$(git rev-parse --show-toplevel 2>/dev/null || pwd)/apps"
npx create-expo-app@latest mobile --template blank-typescript
```

Then update `apps/mobile/package.json`:
- Set `"name": "@babloo/mobile"`
- Add dependency: `"@babloo/shared": "workspace:*"`

**Step 2: Install navigation + core deps**

Run:
```bash
cd "$(git rev-parse --show-toplevel 2>/dev/null || pwd)/apps/mobile"
npx expo install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs react-native-screens react-native-safe-area-context
npx expo install @tanstack/react-query axios
npx expo install expo-font expo-secure-store expo-splash-screen
npx expo install @react-native-async-storage/async-storage
npx expo install i18next react-i18next
npx expo install react-native-svg
npx expo install socket.io-client
```

**Step 3: Create theme**

Create `apps/mobile/src/theme/colors.ts`:
```typescript
export const colors = {
  navy: '#0E1442',
  navyMid: '#1C2462',
  clay: '#C4370D',
  clayLight: '#F0835A',
  clayTint: '#FBF0EC',
  bg: '#EDEEF6',
  bgAlt: '#F4F3FA',
  surface: '#FFFFFF',
  border: '#E2E1EE',
  borderStrong: '#C8C7DC',
  textPrimary: '#0E1442',
  textSec: '#5C5C7A',
  textMuted: '#9898B0',
  success: '#1A7A50',
  successBg: '#EAF5EF',
  warning: '#B06B00',
  warningBg: '#FFF5E0',
  error: '#C0392B',
  white: '#FFFFFF',
  proA: '#6C63FF',
  proB: '#E8517A',
  proC: '#00A99D',
} as const;
```

Create `apps/mobile/src/theme/typography.ts`:
```typescript
export const fonts = {
  fraunces: {
    light: 'Fraunces_300Light',
    medium: 'Fraunces_500Medium',
    semiBold: 'Fraunces_600SemiBold',
    bold: 'Fraunces_700Bold',
    italic: 'Fraunces_400Regular_Italic',
  },
  dmSans: {
    light: 'DMSans_300Light',
    regular: 'DMSans_400Regular',
    medium: 'DMSans_500Medium',
    semiBold: 'DMSans_600SemiBold',
    bold: 'DMSans_700Bold',
  },
} as const;

export const textStyles = {
  display: { fontFamily: 'Fraunces_700Bold', fontSize: 26, lineHeight: 31 },
  h1: { fontFamily: 'Fraunces_600SemiBold', fontSize: 20, lineHeight: 26 },
  h2: { fontFamily: 'Fraunces_600SemiBold', fontSize: 17, lineHeight: 23 },
  h3: { fontFamily: 'DMSans_700Bold', fontSize: 14 },
  body: { fontFamily: 'DMSans_400Regular', fontSize: 13, lineHeight: 21 },
  label: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
  },
} as const;
```

Create `apps/mobile/src/theme/spacing.ts`:
```typescript
export const spacing = {
  xs: 4,
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  '2xl': 36,
} as const;

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  full: 999,
} as const;
```

Create `apps/mobile/src/theme/index.ts`:
```typescript
export { colors } from './colors';
export { fonts, textStyles } from './typography';
export { spacing, radius } from './spacing';
```

**Step 4: Create placeholder screens**

Create `apps/mobile/src/screens/auth/AuthEntryScreen.tsx`:
```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, textStyles } from '../../theme';

export function AuthEntryScreen() {
  return (
    <View style={styles.container}>
      <Text style={[textStyles.display, { color: colors.navy }]}>Babloo</Text>
      <Text style={[textStyles.body, { color: colors.textSec, marginTop: 8 }]}>
        Connexion / Inscription
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
```

Create `apps/mobile/src/screens/home/HomeScreen.tsx`:
```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, textStyles } from '../../theme';

export function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={[textStyles.h1, { color: colors.navy }]}>Accueil</Text>
      <Text style={[textStyles.body, { color: colors.textSec, marginTop: 8 }]}>
        Vos services à domicile
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
```

Create `apps/mobile/src/screens/orders/OrdersListScreen.tsx`:
```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, textStyles } from '../../theme';

export function OrdersListScreen() {
  return (
    <View style={styles.container}>
      <Text style={[textStyles.h1, { color: colors.navy }]}>Commandes</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
```

Create `apps/mobile/src/screens/settings/ProfileScreen.tsx`:
```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, textStyles } from '../../theme';

export function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Text style={[textStyles.h1, { color: colors.navy }]}>Paramètres</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
```

**Step 5: Create navigation**

Create `apps/mobile/src/navigation/AuthStack.tsx`:
```typescript
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthEntryScreen } from '../screens/auth/AuthEntryScreen';

export type AuthStackParamList = {
  AuthEntry: undefined;
  SignInEmail: undefined;
  SignInPhone: undefined;
  SignUpEmail: undefined;
  SignUpPhone: undefined;
  Otp: { challengeId: string; phone: string };
  ForgotPassword: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AuthEntry" component={AuthEntryScreen} />
    </Stack.Navigator>
  );
}
```

Create `apps/mobile/src/navigation/MainTabs.tsx`:
```typescript
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '../screens/home/HomeScreen';
import { OrdersListScreen } from '../screens/orders/OrdersListScreen';
import { ProfileScreen } from '../screens/settings/ProfileScreen';
import { colors } from '../theme';

export type MainTabsParamList = {
  HomeTab: undefined;
  OrdersTab: undefined;
  LoyaltyTab: undefined;
  SettingsTab: undefined;
};

const Tab = createBottomTabNavigator<MainTabsParamList>();

export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.navy,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: {
          fontSize: 9,
          fontWeight: '700',
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{ tabBarLabel: 'Accueil' }}
      />
      <Tab.Screen
        name="OrdersTab"
        component={OrdersListScreen}
        options={{ tabBarLabel: 'Commandes' }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={ProfileScreen}
        options={{ tabBarLabel: 'Paramètres' }}
      />
    </Tab.Navigator>
  );
}
```

Create `apps/mobile/src/navigation/RootNavigator.tsx`:
```typescript
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthStack } from './AuthStack';
import { MainTabs } from './MainTabs';

// Temporary: always show auth. Will be replaced by AuthContext in M2.
const IS_AUTHENTICATED = false;

export function RootNavigator() {
  return (
    <NavigationContainer>
      {IS_AUTHENTICATED ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
}
```

**Step 6: Setup i18n**

Create `apps/mobile/src/i18n/fr.json`:
```json
{
  "common": {
    "loading": "Chargement...",
    "retry": "Réessayer",
    "cancel": "Annuler",
    "confirm": "Confirmer",
    "save": "Enregistrer",
    "back": "Retour",
    "next": "Suivant",
    "done": "Terminé",
    "error": "Une erreur est survenue",
    "networkError": "Erreur de connexion. Vérifiez votre réseau."
  },
  "auth": {
    "signIn": "Connexion",
    "signUp": "Inscription",
    "email": "Adresse e-mail",
    "password": "Mot de passe",
    "phone": "Numéro de téléphone",
    "fullName": "Nom complet",
    "forgotPassword": "Mot de passe oublié ?",
    "noAccount": "Pas encore de compte ?",
    "hasAccount": "Déjà un compte ?",
    "invalidCredentials": "Identifiants invalides",
    "otpSent": "Code envoyé par SMS",
    "enterOtp": "Entrez le code à 6 chiffres",
    "resendOtp": "Renvoyer le code",
    "logout": "Déconnexion"
  },
  "home": {
    "title": "Babloo",
    "subtitle": "Vos services à domicile",
    "services": "Services"
  },
  "nav": {
    "home": "Accueil",
    "orders": "Commandes",
    "loyalty": "Fidèles",
    "settings": "Paramètres"
  }
}
```

Create `apps/mobile/src/i18n/index.ts`:
```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import fr from './fr.json';

i18n.use(initReactI18next).init({
  resources: { fr: { translation: fr } },
  lng: 'fr',
  fallbackLng: 'fr',
  interpolation: { escapeValue: false },
});

export default i18n;
```

**Step 7: Update App.tsx entry point**

Replace `apps/mobile/App.tsx`:
```typescript
import React, { useCallback } from 'react';
import { StatusBar } from 'react-native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';
import './src/i18n';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30_000,
    },
  },
});

export default function App() {
  const [fontsLoaded] = useFonts({
    Fraunces_300Light: require('./assets/fonts/Fraunces-Light.ttf'),
    Fraunces_500Medium: require('./assets/fonts/Fraunces-Medium.ttf'),
    Fraunces_600SemiBold: require('./assets/fonts/Fraunces-SemiBold.ttf'),
    Fraunces_700Bold: require('./assets/fonts/Fraunces-Bold.ttf'),
    Fraunces_400Regular_Italic: require('./assets/fonts/Fraunces-Italic.ttf'),
    DMSans_300Light: require('./assets/fonts/DMSans-Light.ttf'),
    DMSans_400Regular: require('./assets/fonts/DMSans-Regular.ttf'),
    DMSans_500Medium: require('./assets/fonts/DMSans-Medium.ttf'),
    DMSans_600SemiBold: require('./assets/fonts/DMSans-SemiBold.ttf'),
    DMSans_700Bold: require('./assets/fonts/DMSans-Bold.ttf'),
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider onLayout={onLayoutRootView}>
      <QueryClientProvider client={queryClient}>
        <StatusBar barStyle="dark-content" />
        <RootNavigator />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
```

**Step 8: Download fonts**

Download Fraunces and DM Sans font files to `apps/mobile/assets/fonts/`:
- Fraunces-Light.ttf, Fraunces-Medium.ttf, Fraunces-SemiBold.ttf, Fraunces-Bold.ttf, Fraunces-Italic.ttf
- DMSans-Light.ttf, DMSans-Regular.ttf, DMSans-Medium.ttf, DMSans-SemiBold.ttf, DMSans-Bold.ttf

Use Google Fonts API to download:
```bash
mkdir -p apps/mobile/assets/fonts
# Download from Google Fonts (exact URLs determined at implementation time)
```

**Step 9: Verify mobile app launches**

Run: `cd "$(git rev-parse --show-toplevel 2>/dev/null || pwd)" && pnpm install && pnpm --filter @babloo/mobile start`
Expected: Expo dev server starts, app shows AuthEntryScreen in simulator.

**Step 10: Commit**

```bash
git add apps/mobile/
git commit -m "feat(mobile): scaffold Expo app with navigation, theme, i18n, and TanStack Query"
```

---

## Task 8: Mobile — Design System Atoms

**Files:**
- Create: `apps/mobile/src/components/Button.tsx`
- Create: `apps/mobile/src/components/Card.tsx`
- Create: `apps/mobile/src/components/Chip.tsx`
- Create: `apps/mobile/src/components/Input.tsx`
- Create: `apps/mobile/src/components/Stepper.tsx`
- Create: `apps/mobile/src/components/BackHeader.tsx`
- Create: `apps/mobile/src/components/Toast.tsx`
- Create: `apps/mobile/src/components/EmptyState.tsx`
- Create: `apps/mobile/src/components/LoadingState.tsx`
- Create: `apps/mobile/src/components/ErrorState.tsx`
- Create: `apps/mobile/src/components/Avatar.tsx`
- Create: `apps/mobile/src/components/index.ts`

**Step 1: Create Button component**

Create `apps/mobile/src/components/Button.tsx`:
```typescript
import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, radius } from '../theme';

type Variant = 'primary' | 'clay' | 'outline' | 'ghost';
type Size = 'default' | 'xs';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  accessibilityLabel?: string;
}

const variantStyles: Record<Variant, { container: ViewStyle; text: TextStyle }> = {
  primary: {
    container: { backgroundColor: colors.navy },
    text: { color: colors.white },
  },
  clay: {
    container: { backgroundColor: colors.clay },
    text: { color: colors.white },
  },
  outline: {
    container: {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: colors.navy,
    },
    text: { color: colors.navy },
  },
  ghost: {
    container: { backgroundColor: colors.bgAlt },
    text: { color: colors.navy },
  },
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'default',
  disabled = false,
  loading = false,
  style,
  accessibilityLabel,
}: ButtonProps) {
  const v = variantStyles[variant];
  const isXs = size === 'xs';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      accessibilityState={{ disabled: disabled || loading }}
      style={[
        styles.base,
        isXs ? styles.xs : styles.default,
        v.container,
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'outline' || variant === 'ghost' ? colors.navy : colors.white}
          size="small"
        />
      ) : (
        <Text
          style={[
            styles.label,
            isXs ? styles.labelXs : styles.labelDefault,
            v.text,
          ]}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
  },
  default: { height: 52, width: '100%' },
  xs: { height: 30, paddingHorizontal: 12, alignSelf: 'flex-start' },
  label: { fontFamily: 'DMSans_700Bold' },
  labelDefault: { fontSize: 15 },
  labelXs: { fontSize: 11 },
  disabled: { opacity: 0.35 },
});
```

**Step 2: Create remaining atoms**

Create each component following the prototype's design system. (Full implementation code for Card, Chip, Input, Stepper, BackHeader, Toast, EmptyState, LoadingState, ErrorState, Avatar — each matching the CSS classes from the prototype.)

Create `apps/mobile/src/components/Card.tsx`:
```typescript
import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { colors, radius } from '../theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function Card({ children, style }: CardProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 18,
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
});
```

Create `apps/mobile/src/components/Chip.tsx`:
```typescript
import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius } from '../theme';

type ChipVariant = 'default' | 'navy' | 'success' | 'clay' | 'warn';

interface ChipProps {
  label: string;
  variant?: ChipVariant;
  style?: ViewStyle;
}

const variantStyles: Record<ChipVariant, { bg: string; border: string; text: string }> = {
  default: { bg: colors.surface, border: colors.border, text: colors.textSec },
  navy: { bg: 'rgba(14,20,66,0.07)', border: 'rgba(14,20,66,0.14)', text: colors.navy },
  success: { bg: colors.successBg, border: colors.success, text: colors.success },
  clay: { bg: colors.clayTint, border: colors.clayLight, text: colors.clay },
  warn: { bg: colors.warningBg, border: colors.warning, text: colors.warning },
};

export function Chip({ label, variant = 'default', style }: ChipProps) {
  const v = variantStyles[variant];
  return (
    <View
      style={[
        styles.chip,
        { backgroundColor: v.bg, borderColor: v.border },
        style,
      ]}
    >
      <Text style={[styles.text, { color: v.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderRadius: radius.full,
    borderWidth: 1.5,
    alignSelf: 'flex-start',
  },
  text: { fontSize: 10, fontFamily: 'DMSans_700Bold' },
});
```

Create `apps/mobile/src/components/Input.tsx`:
```typescript
import React, { useState } from 'react';
import { TextInput, View, Text, StyleSheet, TextInputProps } from 'react-native';
import { colors, radius } from '../theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({ label, error, style, ...props }: InputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          focused && styles.focused,
          error && styles.errored,
          style,
        ]}
        placeholderTextColor={colors.textMuted}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        accessibilityLabel={label}
        {...props}
      />
      {error && (
        <Text style={styles.error} accessibilityLiveRegion="assertive">
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 14 },
  label: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 12,
    color: colors.textSec,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 11,
    paddingHorizontal: 14,
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: colors.navy,
    backgroundColor: colors.surface,
  },
  focused: { borderColor: colors.navy },
  errored: { borderColor: colors.error },
  error: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 11,
    color: colors.error,
    marginTop: 4,
  },
});
```

Create `apps/mobile/src/components/Stepper.tsx`:
```typescript
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, radius } from '../theme';

interface StepperProps {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  accessibilityLabel: string;
}

export function Stepper({ value, min, max, onChange, accessibilityLabel }: StepperProps) {
  return (
    <View style={styles.container} accessibilityLabel={accessibilityLabel}>
      <TouchableOpacity
        style={styles.btn}
        onPress={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        accessibilityLabel="Diminuer"
        accessibilityRole="button"
      >
        <Text style={[styles.btnText, value <= min && styles.disabled]}>−</Text>
      </TouchableOpacity>
      <Text style={styles.value} accessibilityLabel={`${value}`}>
        {value}
      </Text>
      <TouchableOpacity
        style={styles.btn}
        onPress={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        accessibilityLabel="Augmenter"
        accessibilityRole="button"
      >
        <Text style={[styles.btnText, value >= max && styles.disabled]}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  btn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { fontSize: 18, color: colors.navy, fontFamily: 'DMSans_600SemiBold' },
  value: {
    fontSize: 22,
    fontFamily: 'DMSans_700Bold',
    color: colors.navy,
    minWidth: 30,
    textAlign: 'center',
  },
  disabled: { opacity: 0.35 },
});
```

Create `apps/mobile/src/components/Avatar.tsx`:
```typescript
import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';
type AvatarVariant = 'a' | 'b' | 'c' | 'user';

const SIZE_MAP: Record<AvatarSize, { size: number; fontSize: number }> = {
  sm: { size: 32, fontSize: 11 },
  md: { size: 44, fontSize: 14 },
  lg: { size: 56, fontSize: 18 },
  xl: { size: 72, fontSize: 24 },
};

const GRADIENT_COLORS: Record<AvatarVariant, string[]> = {
  a: ['#6C63FF', '#A080FF'],
  b: ['#E8517A', '#F07AB0'],
  c: ['#00A99D', '#00D4C8'],
  user: ['#1C2462', '#2D3494'],
};

interface AvatarProps {
  name: string;
  size?: AvatarSize;
  variant?: AvatarVariant;
  style?: ViewStyle;
}

export function Avatar({ name, size = 'md', variant = 'user', style }: AvatarProps) {
  const s = SIZE_MAP[size];
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <View
      style={[
        styles.base,
        {
          width: s.size,
          height: s.size,
          borderRadius: s.size / 2,
          backgroundColor: GRADIENT_COLORS[variant][0],
        },
        style,
      ]}
      accessibilityLabel={name}
    >
      <Text style={[styles.text, { fontSize: s.fontSize }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
  text: { color: 'white', fontFamily: 'DMSans_700Bold' },
});
```

Create `apps/mobile/src/components/BackHeader.tsx`:
```typescript
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme';

interface BackHeaderProps {
  title: string;
  chip?: React.ReactNode;
}

export function BackHeader({ title, chip }: BackHeaderProps) {
  const nav = useNavigation();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.btn}
        onPress={() => nav.goBack()}
        accessibilityLabel="Retour"
        accessibilityRole="button"
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text style={styles.arrow}>←</Text>
      </TouchableOpacity>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      {chip}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    paddingTop: 52,
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  btn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrow: { fontSize: 17, color: colors.navy },
  title: {
    flex: 1,
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 17,
    color: colors.navy,
  },
});
```

Create `apps/mobile/src/components/EmptyState.tsx`:
```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme';
import { Button } from './Button';

interface EmptyStateProps {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ title, message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction && (
        <Button
          label={actionLabel}
          onPress={onAction}
          variant="outline"
          size="xs"
          style={{ marginTop: 16 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  title: { fontFamily: 'Fraunces_600SemiBold', fontSize: 17, color: colors.navy, textAlign: 'center' },
  message: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.textSec, textAlign: 'center', marginTop: 8, lineHeight: 21 },
});
```

Create `apps/mobile/src/components/LoadingState.tsx`:
```typescript
import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from '../theme';

export function LoadingState() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.navy} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
```

Create `apps/mobile/src/components/ErrorState.tsx`:
```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme';
import { Button } from './Button';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  message = 'Une erreur est survenue',
  onRetry,
}: ErrorStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <Button
          label="Réessayer"
          onPress={onRetry}
          variant="outline"
          size="xs"
          style={{ marginTop: 16 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  message: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.error, textAlign: 'center' },
});
```

Create `apps/mobile/src/components/Toast.tsx`:
```typescript
import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';
import { colors, radius } from '../theme';

interface ToastProps {
  message: string;
  visible: boolean;
  onDismiss: () => void;
  duration?: number;
}

export function Toast({ message, visible, onDismiss, duration = 2600 }: ToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.delay(duration),
        Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]).start(() => onDismiss());
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: colors.navy,
    borderRadius: radius.md,
    padding: 14,
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 40,
    elevation: 8,
  },
  text: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    color: colors.white,
    textAlign: 'center',
  },
});
```

Create `apps/mobile/src/components/index.ts`:
```typescript
export { Button } from './Button';
export { Card } from './Card';
export { Chip } from './Chip';
export { Input } from './Input';
export { Stepper } from './Stepper';
export { Avatar } from './Avatar';
export { BackHeader } from './BackHeader';
export { Toast } from './Toast';
export { EmptyState } from './EmptyState';
export { LoadingState } from './LoadingState';
export { ErrorState } from './ErrorState';
```

**Step 3: Verify app still launches**

Run: `pnpm --filter @babloo/mobile start`
Expected: No errors, AuthEntryScreen renders.

**Step 4: Commit**

```bash
git add apps/mobile/src/components/
git commit -m "feat(mobile): add design system atom components matching prototype"
```

---

## Task 9: API Client + Services Scaffold

**Files:**
- Create: `apps/mobile/src/services/api.ts`
- Create: `apps/mobile/src/services/socket.ts`

**Step 1: Create API client**

Create `apps/mobile/src/services/api.ts`:
```typescript
import axios from 'axios';
import { v4 as uuid } from 'uuid';

// Will be replaced by env config. Points to Railway in staging.
const BASE_URL = __DEV__
  ? 'http://localhost:3000/v1'
  : 'https://babloo-api.up.railway.app/v1';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: attach auth + idempotency
api.interceptors.request.use((config) => {
  // Auth token will be attached by AuthContext interceptor in M2
  // Idempotency key for POST requests
  if (config.method === 'post' && !config.headers['Idempotency-Key']) {
    config.headers['Idempotency-Key'] = uuid();
  }
  return config;
});
```

Note: `uuid` will need to be installed. Add as dependency or use `expo-crypto` for UUID generation.

**Step 2: Create Socket.IO client scaffold**

Create `apps/mobile/src/services/socket.ts`:
```typescript
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = __DEV__
  ? 'http://localhost:3000'
  : 'https://babloo-api.up.railway.app';

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  return socket;
}

export function connectSocket(accessToken: string): Socket {
  if (socket?.connected) {
    socket.disconnect();
  }

  socket = io(SOCKET_URL, {
    auth: { token: accessToken },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 10,
  });

  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}
```

**Step 3: Install uuid**

```bash
cd "$(git rev-parse --show-toplevel 2>/dev/null || pwd)/apps/mobile"
npx expo install expo-crypto
```

Update `api.ts` to use `expo-crypto` instead of `uuid`:
```typescript
import * as Crypto from 'expo-crypto';
// Replace uuid() with Crypto.randomUUID()
```

**Step 4: Commit**

```bash
git add apps/mobile/src/services/
git commit -m "feat(mobile): add API client and Socket.IO client scaffold"
```

---

## Task 10: Verify Full Stack Locally

**Step 1: Start local Postgres, run migration + seed**

```bash
createdb babloo 2>/dev/null || true
cd "$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
pnpm --filter @babloo/api db:migrate -- --name init
pnpm --filter @babloo/api db:seed
```

**Step 2: Start API**

```bash
pnpm dev:api
```

Verify: `curl http://localhost:3000/v1/health`
Expected: `{"status":"ok","timestamp":"..."}`

**Step 3: Start mobile**

In new terminal:
```bash
pnpm dev:mobile
```

Expected: Expo dev server, app renders AuthEntryScreen on iOS simulator or Android emulator.

**Step 4: Run shared tests**

```bash
pnpm --filter @babloo/shared test
```

Expected: ALL PASS (pricing + FSM + phone normalization tests)

**Step 5: Run full build check**

```bash
pnpm build
```

Expected: All 3 packages build without errors.

**Step 6: Final commit**

```bash
git add -A
git commit -m "chore(m1): foundation milestone complete — monorepo, schema, design system, nav shell"
```

---

## M1 Definition of Done

- [ ] pnpm monorepo with 3 packages builds (`pnpm build`)
- [ ] Shared pricing engine tests pass (all brackets, deep clean, squad floor)
- [ ] Shared FSM tests pass (all valid/invalid transitions)
- [ ] Shared phone normalization tests pass
- [ ] Prisma migrates and seeds against local Postgres
- [ ] API health endpoint returns 200
- [ ] Mobile app launches in simulator with AuthEntryScreen
- [ ] Navigation shell: AuthStack + MainTabs + placeholder screens
- [ ] Design system atoms: Button, Card, Chip, Input, Stepper, Avatar, BackHeader, Toast, EmptyState, LoadingState, ErrorState
- [ ] Theme matches prototype: colors, typography, spacing, radius
- [ ] i18n initialized with French
- [ ] TanStack Query + axios + Socket.IO client scaffolded
