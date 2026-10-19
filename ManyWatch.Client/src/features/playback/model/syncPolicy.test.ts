import { describe, expect, it } from 'vitest';
import { planPlaybackSync, type PlayerSnapshot } from './syncPolicy';
import type { PlaybackOrigin, PlaybackState } from './types';

const RECEIVED_AT_MS = 1_000;

function createState(overrides: Partial<PlaybackState> = {}): PlaybackState {
  return {
    videoUrl: 'https://example.com/movie.mp4',
    isPlaying: false,
    positionSeconds: 10,
    durationSeconds: 100,
    updatedAtUtc: '2026-01-01T00:00:00Z',
    updatedByUserId: '00000000-0000-0000-0000-000000000000',
    receivedAtMs: RECEIVED_AT_MS,
    ...overrides,
  };
}

function snapshot(overrides: Partial<PlayerSnapshot> = {}): PlayerSnapshot {
  return {
    currentTime: 10,
    isPaused: true,
    ...overrides,
  };
}

describe('planPlaybackSync', () => {
  it('seeks and starts playback when a start update is far off', () => {
    const plan = planPlaybackSync(
      createState({ isPlaying: true }),
      'update',
      snapshot({ currentTime: 4, isPaused: true }),
      RECEIVED_AT_MS,
    );

    expect(plan).toEqual({ targetSeconds: 10, seek: true, play: true, pause: false });
  });

  it('starts playback without seeking when close enough', () => {
    const plan = planPlaybackSync(
      createState({ isPlaying: true }),
      'initial',
      snapshot({ currentTime: 9.4, isPaused: true }),
      RECEIVED_AT_MS,
    );

    expect(plan.seek).toBe(false);
    expect(plan.play).toBe(true);
  });

  it('does not seek while the drift stays within tolerance', () => {
    const withinTolerance = planPlaybackSync(
      createState({ isPlaying: true }),
      'update',
      snapshot({ currentTime: 9.25, isPaused: false }),
      RECEIVED_AT_MS,
    );
    const aboveTolerance = planPlaybackSync(
      createState({ isPlaying: true }),
      'update',
      snapshot({ currentTime: 9.1, isPaused: false }),
      RECEIVED_AT_MS,
    );

    expect(withinTolerance.seek).toBe(false);
    expect(aboveTolerance.seek).toBe(true);
  });

  it('uses the wider tolerance for periodic sync', () => {
    const origin: PlaybackOrigin = 'sync';
    const state = createState({ isPlaying: true });

    const withStartTolerance = planPlaybackSync(state, 'update', snapshot({ currentTime: 8.8 }), RECEIVED_AT_MS);
    const withSyncTolerance = planPlaybackSync(state, origin, snapshot({ currentTime: 8.8 }), RECEIVED_AT_MS);

    expect(withStartTolerance.seek).toBe(true);
    expect(withSyncTolerance.seek).toBe(false);
  });

  it('pauses and seeks when a pause update is far off', () => {
    const plan = planPlaybackSync(
      createState({ isPlaying: false, positionSeconds: 30 }),
      'update',
      snapshot({ currentTime: 20, isPaused: false }),
      RECEIVED_AT_MS,
    );

    expect(plan).toEqual({ targetSeconds: 30, seek: true, play: false, pause: true });
  });

  it('keeps a small pause drift untouched', () => {
    const plan = planPlaybackSync(
      createState({ isPlaying: false, positionSeconds: 30 }),
      'sync',
      snapshot({ currentTime: 30.3, isPaused: true }),
      RECEIVED_AT_MS,
    );

    expect(plan.seek).toBe(false);
    expect(plan.pause).toBe(false);
  });

  it('extrapolates the elapsed time while the video is playing', () => {
    const plan = planPlaybackSync(
      createState({ isPlaying: true, positionSeconds: 10 }),
      'update',
      snapshot({ currentTime: 10, isPaused: false }),
      RECEIVED_AT_MS + 5_000,
    );

    expect(plan.targetSeconds).toBe(15);
    expect(plan.seek).toBe(true);
  });

  it('does not extrapolate while paused', () => {
    const plan = planPlaybackSync(
      createState({ isPlaying: false, positionSeconds: 10 }),
      'sync',
      snapshot({ currentTime: 10 }),
      RECEIVED_AT_MS + 5_000,
    );

    expect(plan.targetSeconds).toBe(10);
  });

  it('clamps a negative target to zero when the clocks disagree', () => {
    const plan = planPlaybackSync(
      createState({ isPlaying: true, positionSeconds: 2, receivedAtMs: RECEIVED_AT_MS + 10_000 }),
      'update',
      snapshot({ currentTime: 0, isPaused: false }),
      RECEIVED_AT_MS,
    );

    expect(plan.targetSeconds).toBe(0);
  });
});
