import type { PlayerController } from '../players/types';
import type { PlaybackOrigin, PlaybackState } from './types';

export const PLAY_START_TOLERANCE_SECONDS = 0.8;
export const PLAY_SYNC_TOLERANCE_SECONDS = 1.5;
export const PAUSE_TOLERANCE_SECONDS = 0.5;

export type PlayerSnapshot = {
  currentTime: number;
  isPaused: boolean;
};

export type SyncPlan = {
  /** Position the player should be at right now (extrapolated while playing). */
  targetSeconds: number;
  seek: boolean;
  play: boolean;
  pause: boolean;
};

/**
 * Decides how a remote playback state must be applied to the local player.
 * Pure on purpose: RoomPlayer only reads the controller, calls this function
 * and executes the resulting plan, which keeps the timing rules testable
 * without a DOM or a real player.
 */
export function planPlaybackSync(
  state: PlaybackState,
  origin: PlaybackOrigin,
  snapshot: PlayerSnapshot,
  nowMs: number,
): SyncPlan {
  const elapsed = state.isPlaying ? (nowMs - state.receivedAtMs) / 1000 : 0;
  const targetSeconds = Math.max(0, state.positionSeconds + elapsed);
  const drift = Math.abs(snapshot.currentTime - targetSeconds);

  if (state.isPlaying) {
    const tolerance =
      origin === 'sync' ? PLAY_SYNC_TOLERANCE_SECONDS : PLAY_START_TOLERANCE_SECONDS;

    return {
      targetSeconds,
      seek: drift > tolerance,
      play: snapshot.isPaused,
      pause: false,
    };
  }

  return {
    targetSeconds,
    seek: drift > PAUSE_TOLERANCE_SECONDS,
    play: false,
    pause: !snapshot.isPaused,
  };
}

/**
 * Reads the current player state so callers do not have to remember both
 * getters of PlayerController.
 */
export function snapshotPlayer(controller: PlayerController): PlayerSnapshot {
  return {
    currentTime: controller.currentTime(),
    isPaused: controller.isPaused(),
  };
}
