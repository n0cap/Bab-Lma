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
