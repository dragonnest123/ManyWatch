export type PlaybackStateDto = {
  videoUrl: string | null;
  isPlaying: boolean;
  positionSeconds: number;
  durationSeconds: number;
  updatedAtUtc: string;
  updatedByUserId: string;
};

export type PlaybackState = PlaybackStateDto & {
  /** Client-side timestamp of when the state was received, used to extrapolate the position. */
  receivedAtMs: number;
};

export type PlaybackUpdate = {
  videoUrl: string | null;
  isPlaying: boolean;
  positionSeconds: number;
  durationSeconds: number;
};

export type PlaybackOrigin = 'initial' | 'update' | 'sync';

export type RoomConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';
