import { useEffect } from 'react';
import type { PlayerController } from '../../playback/players/types';
import { recordWatchTime } from '../api/profileApi';
import { getWatchedDelta } from '../model/watchProgress';

const TICK_INTERVAL_MS = 1_000;
const FLUSH_INTERVAL_MS = 15_000;
const MAX_REPORT_SECONDS = 300;

type PlayerRef = {
  current: PlayerController | null;
};

/**
 * Reports actual video playback progress while a signed-in viewer is watching.
 * A full second counter is sent to the API every 15 seconds and on unmount.
 */
export function useWatchTimeTracker(playerRef: PlayerRef, enabled: boolean) {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    let previousPosition: number | null = null;
    let pendingSeconds = 0;
    let isFlushing = false;

    const flush = () => {
      const seconds = Math.min(Math.floor(pendingSeconds), MAX_REPORT_SECONDS);

      if (seconds < 1 || isFlushing) {
        return;
      }

      pendingSeconds -= seconds;
      isFlushing = true;

      void recordWatchTime(seconds)
        .catch(() => {
          pendingSeconds += seconds;
        })
        .finally(() => {
          isFlushing = false;
        });
    };

    const tick = () => {
      const player = playerRef.current;

      if (
        !player?.ready
        || player.isPaused()
        || document.visibilityState !== 'visible'
      ) {
        previousPosition = null;
        return;
      }

      const currentPosition = player.currentTime();
      pendingSeconds += getWatchedDelta(previousPosition, currentPosition);
      previousPosition = currentPosition;
    };

    const handleVisibilityChange = () => {
      previousPosition = null;

      if (document.visibilityState !== 'visible') {
        flush();
      }
    };

    const handlePageHide = () => flush();

    const tickTimer = window.setInterval(tick, TICK_INTERVAL_MS);
    const flushTimer = window.setInterval(flush, FLUSH_INTERVAL_MS);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      window.clearInterval(tickTimer);
      window.clearInterval(flushTimer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      flush();
    };
  }, [enabled, playerRef]);
}
