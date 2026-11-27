import { describe, expect, it } from 'vitest';
import { isValidHttpUrl, isValidSiret } from '../siret';

describe('SIRET and URL validators', () => {
  it('validates standard Luhn 14-digit SIRETs and La Poste exception', () => {
    expect(isValidSiret('73282932000074')).toBe(true);
    expect(isValidSiret('35600000000048')).toBe(true);
    expect(isValidSiret('35600000000010')).toBe(true);
    expect(isValidSiret('12345678901234')).toBe(false);
    expect(isValidSiret('7328293200007')).toBe(false);
    expect(isValidSiret('7328293200007A')).toBe(false);
  });

  it('validates optional http/https URLs', () => {
    expect(isValidHttpUrl('')).toBe(true);
    expect(isValidHttpUrl('https://example.com/logo.png')).toBe(true);
    expect(isValidHttpUrl('http://localhost:3000/logo.png')).toBe(true);
    expect(isValidHttpUrl('ftp://example.com/logo.png')).toBe(false);
    expect(isValidHttpUrl('not-a-url')).toBe(false);
  });
});
