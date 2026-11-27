import { describe, expect, it } from 'vitest';
import {
  getExpiryAlertStatus,
  getVisibleCategories,
  getWritableCategories,
  isSelfServiceWritableCategory,
  isSensitiveCategory,
} from './taxonomy';

describe('EmployeeDocumentTaxonomy', () => {
  it('hides disciplinary and departure categories when read:sensitive is missing', () => {
    expect(isSensitiveCategory('disciplinary')).toBe(true);
    expect(isSensitiveCategory('departure')).toBe(true);
    expect(isSensitiveCategory('personalFile')).toBe(false);

    expect(getVisibleCategories(false)).toEqual([
      'personalFile',
      'personalEvents',
      'contractualElements',
      'integration',
    ]);
    expect(getVisibleCategories(true)).toHaveLength(6);
  });

  it('restricts self-service writable categories to personalFile and personalEvents', () => {
    expect(isSelfServiceWritableCategory('personalFile')).toBe(true);
    expect(isSelfServiceWritableCategory('personalEvents')).toBe(true);
    expect(isSelfServiceWritableCategory('contractualElements')).toBe(false);

    expect(getWritableCategories(false, true)).toEqual(['personalFile', 'personalEvents']);
    expect(getWritableCategories(true, false)).toHaveLength(6);
  });

  it('computes expiry alert statuses for expired, <=7d, <=30d and valid dates', () => {
    const now = new Date('2026-11-01T12:00:00Z');

    expect(getExpiryAlertStatus('2026-10-31', now)).toMatchObject({
      status: 'expired',
      variant: 'danger',
    });
    expect(getExpiryAlertStatus('2026-11-06', now)).toMatchObject({
      status: 'critical',
      daysRemaining: 5,
      variant: 'danger',
    });
    expect(getExpiryAlertStatus('2026-11-20', now)).toMatchObject({
      status: 'warning',
      daysRemaining: 19,
      variant: 'warning',
    });
    expect(getExpiryAlertStatus('2027-03-15', now)).toMatchObject({
      status: 'valid',
      variant: 'success',
    });
  });
});
