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
