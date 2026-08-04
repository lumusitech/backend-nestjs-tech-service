import { addDaysToDateString } from './date-filter.util';

describe('addDaysToDateString', () => {
  it('should return the next day for a normal date', () => {
    expect(addDaysToDateString('2026-06-30', 1)).toBe('2026-07-01');
  });

  it('should roll over to the next month', () => {
    expect(addDaysToDateString('2026-01-31', 1)).toBe('2026-02-01');
  });

  it('should roll over to the next year', () => {
    expect(addDaysToDateString('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('should handle leap years', () => {
    expect(addDaysToDateString('2028-02-28', 1)).toBe('2028-02-29');
    expect(addDaysToDateString('2026-02-28', 1)).toBe('2026-03-01');
  });

  it('should support subtracting days', () => {
    expect(addDaysToDateString('2026-01-01', -1)).toBe('2025-12-31');
  });

  it('should be idempotent for single-digit days', () => {
    expect(addDaysToDateString('2026-01-05', 1)).toBe('2026-01-06');
  });
});
