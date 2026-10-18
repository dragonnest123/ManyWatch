import type { PlayerCallbacks, PlayerController } from './types';

type YouTubePlayerState = number;

type YouTubePlayer = {
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
  getDuration(): number;
  getPlayerState(): YouTubePlayerState;
  mute(): void;
  unMute(): void;
  destroy(): void;
};

type YouTubeApi = {
  Player: new (
    element: HTMLElement,
    options: {
      videoId: string;
      playerVars?: Record<string, number | string>;
      events?: {
        onReady?: () => void;
        onStateChange?: (event: { data: YouTubePlayerState }) => void;
        onError?: () => void;
      };
    },
  ) => YouTubePlayer;
  PlayerState: {
    UNSTARTED: -1;
    ENDED: 0;
    PLAYING: 1;
    PAUSED: 2;
    BUFFERING: 3;
    CUED: 5;
  };
};

declare global {
  interface Window {
    YT?: YouTubeApi;
    onYouTubeIframeAPIReady?: () => void;
  }
}

const SEEK_DRIFT_THRESHOLD_SECONDS = 1.5;
const PENDING_SEEK_TIMEOUT_MS = 10_000;
const SEEK_SETTLE_TIMEOUT_MS = 15_000;
const TIME_CHECK_INTERVAL_MS = 500;
const PLAY_START_TIMEOUT_MS = 1_500;

let apiPromise: Promise<YouTubeApi> | null = null;

function loadYouTubeApi(): Promise<YouTubeApi> {
  if (window.YT?.Player) {
    return Promise.resolve(window.YT);
  }

  apiPromise ??= new Promise<YouTubeApi>((resolve) => {
    const previousHandler = window.onYouTubeIframeAPIReady;

    window.onYouTubeIframeAPIReady = () => {
      previousHandler?.();
      resolve(window.YT as YouTubeApi);
    };

    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    document.head.appendChild(script);
  });

  return apiPromise;
}

/**
 * Wraps the YouTube IFrame Player API. The API has no seek event, so user
 * seeks are detected by comparing the reported position with the position
 * expected from the reference point in time.
 */
export function createYouTubePlayerController(
  host: HTMLDivElement,
  videoId: string,
  callbacks: PlayerCallbacks,
): PlayerController {
  let api: YouTubeApi | null = null;
  let player: YouTubePlayer | null = null;
  let ready = false;
  let destroyed = false;
  let suppressNextPlay = false;
  let suppressNextPause = false;
  let programmaticSeek: { target: number; at: number } | null = null;
  let intentPlaying = false;
  let awaitingSeekSettleUntil = 0;
  let hasStartedPlayback = false;
  let deferredPosition: number | null = null;

  const reference = { time: 0, at: Date.now(), advancing: false };

  function currentTime(): number {
    return player?.getCurrentTime() ?? 0;
  }

  function resetReference() {
    reference.time = currentTime();
    reference.at = Date.now();
    reference.advancing = api !== null && player?.getPlayerState() === api.PlayerState.PLAYING;
  }

  function waitForPlaying(timeoutMs: number): Promise<boolean> {
    return new Promise((resolve) => {
      const deadline = Date.now() + timeoutMs;

      const check = () => {
        if (destroyed || !player || !api) {
          resolve(false);
          return;
        }

        if (player.getPlayerState() === api.PlayerState.PLAYING) {
          resolve(true);
          return;
        }

        if (Date.now() >= deadline) {
          resolve(false);
          return;
        }

        window.setTimeout(check, 100);
      };

      check();
    });
  }

  function handleStateChange(state: YouTubePlayerState) {
    if (destroyed || !api) {
      return;
    }

    resetReference();

    if (state === api.PlayerState.PLAYING) {
      if (suppressNextPlay) {
        suppressNextPlay = false;
        intentPlaying = true;
        hasStartedPlayback = true;
        return;
      }

      // The YouTube player sometimes resumes playback on its own right after
      // a programmatic seek on a paused video. Keep it paused and stay silent
      // instead of announcing a play to the whole room.
      if (Date.now() < awaitingSeekSettleUntil) {
        awaitingSeekSettleUntil = 0;
        programmaticSeek = null;
        suppressNextPause = true;
        player?.pauseVideo();
        return;
      }

      if (deferredPosition !== null) {
        // The viewer pressed play before the room position had been applied
        // (a fresh player is never seeked while paused). Catch up to the room
        // position before announcing the play.
        const target = deferredPosition;
        deferredPosition = null;
        programmaticSeek = { target, at: Date.now() };
        suppressNextPlay = true;
        player?.seekTo(target, true);
        intentPlaying = true;
        hasStartedPlayback = true;
        callbacks.onUserPlay(target);
        return;
      }

      intentPlaying = true;
      hasStartedPlayback = true;
      callbacks.onUserPlay(currentTime());
      return;
    }

    if (state === api.PlayerState.PAUSED) {
      intentPlaying = false;
      awaitingSeekSettleUntil = 0;

      if (suppressNextPause) {
        suppressNextPause = false;
        return;
      }

      callbacks.onUserPause(currentTime());
      return;
    }

    if (state === api.PlayerState.ENDED) {
      intentPlaying = false;
      awaitingSeekSettleUntil = 0;
      callbacks.onEnded();
      return;
    }

    // Settled states (unstarted/cued/buffering transitions do not settle, but
    // unstarted and cued do): loading finished, a delayed self-start can no
    // longer be expected.
    if (state === api.PlayerState.UNSTARTED || state === api.PlayerState.CUED) {
      awaitingSeekSettleUntil = 0;
    }
  }

  function detectSeek() {
    if (destroyed || !ready || !player || !api) {
      return;
    }

    const state = player.getPlayerState();

    // Only PLAYING and PAUSED are stable states; everything else (loading,
    // buffering, cued) produces unreliable positions and is skipped.
    if (state !== api.PlayerState.PLAYING && state !== api.PlayerState.PAUSED) {
      resetReference();
      return;
    }

    const actual = player.getCurrentTime();
    const now = Date.now();
    const expected = reference.time + (reference.advancing ? (now - reference.at) / 1000 : 0);

    if (Math.abs(actual - expected) <= SEEK_DRIFT_THRESHOLD_SECONDS) {
      return;
    }

    const seekTarget = programmaticSeek;
    programmaticSeek = null;
    reference.time = actual;
    reference.at = now;
    reference.advancing = state === api.PlayerState.PLAYING;

    const wasProgrammaticSeek =
      seekTarget !== null &&
      now - seekTarget.at <= PENDING_SEEK_TIMEOUT_MS &&
      Math.abs(actual - seekTarget.target) <= 1;

    if (!wasProgrammaticSeek) {
      callbacks.onUserSeek(actual);
    }
  }

  const intervalId = window.setInterval(detectSeek, TIME_CHECK_INTERVAL_MS);

  void loadYouTubeApi().then((loadedApi) => {
    if (destroyed) {
      return;
    }

    api = loadedApi;

    const playerHost = document.createElement('div');
    host.replaceChildren(playerHost);

    player = new api.Player(playerHost, {
      videoId,
      playerVars: { playsinline: 1, rel: 0 },
      events: {
        onReady: () => {
          if (destroyed) {
            return;
          }

          ready = true;
          resetReference();
          callbacks.onReady();
        },
        onStateChange: (event) => handleStateChange(event.data),
        onError: () => callbacks.onError('This YouTube video cannot be embedded. Try another link'),
      },
    });
  });

  return {
    get ready() {
      return ready;
    },
    currentTime,
    duration() {
      return player?.getDuration() ?? 0;
    },
    isPaused() {
      if (!player || !api) {
        return true;
      }

      return !intentPlaying;
    },
    async play() {
      if (!player || !api || destroyed) {
        return;
      }

      if (player.getPlayerState() !== api.PlayerState.PLAYING) {
        suppressNextPlay = true;
      }

      if (deferredPosition !== null) {
        const target = deferredPosition;
        deferredPosition = null;
        programmaticSeek = { target, at: Date.now() };
        player.seekTo(target, true);
      }

      player.playVideo();

      if (await waitForPlaying(PLAY_START_TIMEOUT_MS)) {
        return;
      }

      if (destroyed || !player) {
        return;
      }

      // Autoplay with sound is blocked until the viewer interacts with the
      // page. Start muted so playback stays in sync and ask to unmute.
      player.mute();
      callbacks.onAutoplayBlocked();

      if (player.getPlayerState() !== api.PlayerState.PLAYING) {
        suppressNextPlay = true;
      }

      player.playVideo();
      await waitForPlaying(PLAY_START_TIMEOUT_MS);
    },
    pause() {
      if (!player || !api || destroyed) {
        return;
      }

      intentPlaying = false;

      if (player.getPlayerState() !== api.PlayerState.PAUSED) {
        suppressNextPause = true;
      }

      player.pauseVideo();
    },
    seek(seconds) {
      if (!player || !api || destroyed) {
        return;
      }

      const target = Math.max(0, seconds);

      if (!hasStartedPlayback) {
        // On a video that has never been started, both seekTo() and
        // cueVideoById() can begin playback on their own. Remember the
        // position and apply it when playback actually starts; a paused
        // fresh player is left untouched.
        deferredPosition = target;
        return;
      }

      programmaticSeek = { target, at: Date.now() };

      // A seek on a paused player must not be turned into playback.
      if (!intentPlaying) {
        awaitingSeekSettleUntil = Date.now() + SEEK_SETTLE_TIMEOUT_MS;
      }

      player.seekTo(target, true);
    },
    setMuted(muted) {
      if (!player) {
        return;
      }

      if (muted) {
        player.mute();
      } else {
        player.unMute();
      }
    },
    destroy() {
      destroyed = true;
      window.clearInterval(intervalId);
      player?.destroy();
      player = null;
      host.replaceChildren();
    },
  };
}
