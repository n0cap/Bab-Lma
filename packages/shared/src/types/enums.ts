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
