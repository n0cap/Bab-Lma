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
