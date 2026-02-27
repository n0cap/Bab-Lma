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
