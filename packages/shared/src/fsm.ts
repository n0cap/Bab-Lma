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
