import { describe, expect, it } from 'vitest';
import { formatWatchedHours } from './format';

describe('formatWatchedHours', () => {
  it('returns zero for missing or invalid values', () => {
    expect(formatWatchedHours(0)).toBe('0');
    expect(formatWatchedHours(Number.NaN)).toBe('0');
    expect(formatWatchedHours(-100)).toBe('0');
  });

  it('formats hours with one decimal below ten hours', () => {
    expect(formatWatchedHours(3600)).toBe('1');
    expect(formatWatchedHours(5400)).toBe('1.5');
    expect(formatWatchedHours(36)).toBe('0');
  });

  it('rounds larger totals to whole hours', () => {
    expect(formatWatchedHours(10 * 3600)).toBe('10');
    expect(formatWatchedHours(12.6 * 3600)).toBe('13');
  });
});
