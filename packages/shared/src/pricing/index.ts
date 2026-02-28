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
