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
