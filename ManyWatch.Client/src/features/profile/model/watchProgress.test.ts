import { describe, expect, it } from 'vitest';
import { getWatchedDelta } from './watchProgress';

describe('getWatchedDelta', () => {
  it('counts natural playback progress', () => {
    expect(getWatchedDelta(10, 11)).toBe(1);
    expect(getWatchedDelta(10, 10.5)).toBe(0.5);
  });

  it('ignores seeks, loops and stalled playback', () => {
    expect(getWatchedDelta(10, 30)).toBe(0);
    expect(getWatchedDelta(30, 10)).toBe(0);
    expect(getWatchedDelta(10, 10)).toBe(0);
  });

  it('ignores the first tick and invalid values', () => {
    expect(getWatchedDelta(null, 10)).toBe(0);
    expect(getWatchedDelta(Number.NaN, 10)).toBe(0);
    expect(getWatchedDelta(10, Number.NaN)).toBe(0);
  });
});
