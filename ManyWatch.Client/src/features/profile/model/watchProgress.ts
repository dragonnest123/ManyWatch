export const MAX_TICK_DELTA_SECONDS = 2.5;

/**
 * Returns how much real playback progress happened between two player ticks.
 * Seeks, loops and stalled players jump outside the allowed delta and are
 * ignored so they cannot inflate the watched time.
 */
export function getWatchedDelta(previousSeconds: number | null, currentSeconds: number): number {
  if (
    previousSeconds === null
    || !Number.isFinite(previousSeconds)
    || !Number.isFinite(currentSeconds)
  ) {
    return 0;
  }

  const delta = currentSeconds - previousSeconds;

  return delta > 0 && delta <= MAX_TICK_DELTA_SECONDS ? delta : 0;
}
