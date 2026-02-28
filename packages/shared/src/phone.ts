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
