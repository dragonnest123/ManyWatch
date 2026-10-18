export type PlayerCallbacks = {
  onReady(): void;
  onUserPlay(positionSeconds: number): void;
  onUserPause(positionSeconds: number): void;
  onUserSeek(positionSeconds: number): void;
  onEnded(): void;
  onAutoplayBlocked(): void;
  onError(message: string): void;
};

/**
 * Imperative wrapper around a provider player (native <video> or YouTube
 * iframe). Programmatic controls suppress their own events so that only real
 * user actions are reported through the callbacks.
 */
export type PlayerController = {
  readonly ready: boolean;
  currentTime(): number;
  duration(): number;
  isPaused(): boolean;
  play(): Promise<void>;
  pause(): void;
  seek(seconds: number): void;
  setMuted(muted: boolean): void;
  destroy(): void;
};
