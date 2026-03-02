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
      const fallbackBracket = BRACKETS.find((b) => b[teamType] !== null);
      if (!fallbackBracket) {
        throw new Error(`Team type '${teamType}' is not supported for any surface`);
      }
      basePrice = fallbackBracket[teamType]!;
    } else {
      basePrice = teamPrice;
    }
  } else {
    // Over 300m²: use 300m² base + surcharge per extra 50m² block
    const base300 = BRACKETS[BRACKETS.length - 1][teamType];
    let baseForTeam: number;
    if (base300 === null) {
      const fallbackBracket = BRACKETS.find((b) => b[teamType] !== null);
      if (!fallbackBracket) {
        throw new Error(`Team type '${teamType}' is not supported for any surface`);
      }
      baseForTeam = fallbackBracket[teamType]!;
    } else {
      baseForTeam = base300;
    }
    const extraBlocks = Math.ceil((surface - 300) / 50);
    basePrice = baseForTeam + extraBlocks * SURCHARGE_PER_50M2[teamType];
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
