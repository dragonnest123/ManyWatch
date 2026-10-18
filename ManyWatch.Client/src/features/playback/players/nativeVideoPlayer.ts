import type { PlayerCallbacks, PlayerController } from './types';

const SEEK_MATCH_TOLERANCE_SECONDS = 0.35;
const PENDING_EVENT_TIMEOUT_MS = 3_000;

/**
 * Wraps a native <video> element. Programmatic play/pause/seek calls are
 * remembered as "expected" events so their own events are ignored, while a
 * real user action is always reported - even when it happens right after a
 * remote-controlled change.
 */
export function createNativeVideoController(
  video: HTMLVideoElement,
  src: string,
  callbacks: PlayerCallbacks,
): PlayerController {
  let ready = false;
  let expectPlayUntil = 0;
  let expectPauseUntil = 0;
  let pendingSeek: { target: number; at: number } | null = null;

  // The controller owns the src attribute (React does not render it) so that
  // mounting, source switches and StrictMode remounts all follow the same
  // deterministic load/unload sequence.
  if (video.getAttribute('src') !== src) {
    video.src = src;
  }

  const markReady = () => {
    if (ready) {
      return;
    }

    ready = true;
    callbacks.onReady();
  };

  const handlePlay = () => {
    if (Date.now() < expectPlayUntil) {
      expectPlayUntil = 0;
      return;
    }

    callbacks.onUserPlay(video.currentTime);
  };

  const handlePause = () => {
    if (video.ended) {
      expectPauseUntil = 0;
      return;
    }

    if (Date.now() < expectPauseUntil) {
      expectPauseUntil = 0;
      return;
    }

    callbacks.onUserPause(video.currentTime);
  };

  const handleSeeked = () => {
    const isOwnSeek =
      pendingSeek !== null &&
      Date.now() - pendingSeek.at <= PENDING_EVENT_TIMEOUT_MS &&
      Math.abs(video.currentTime - pendingSeek.target) <= SEEK_MATCH_TOLERANCE_SECONDS;

    pendingSeek = null;

    if (isOwnSeek) {
      return;
    }

    callbacks.onUserSeek(video.currentTime);
  };

  const handleEnded = () => {
    callbacks.onEnded();
  };

  const handleError = () => {
    if (video.error) {
      callbacks.onError(
        'This video could not be played. Use a direct link to a video file (mp4/webm) or a YouTube link.',
      );
    }
  };

  video.addEventListener('loadedmetadata', markReady);
  video.addEventListener('canplay', markReady);
  video.addEventListener('play', handlePlay);
  video.addEventListener('pause', handlePause);
  video.addEventListener('seeked', handleSeeked);
  video.addEventListener('ended', handleEnded);
  video.addEventListener('error', handleError);

  return {
    get ready() {
      return ready;
    },
    currentTime() {
      return video.currentTime;
    },
    duration() {
      return Number.isFinite(video.duration) ? video.duration : 0;
    },
    isPaused() {
      return video.paused;
    },
    async play() {
      if (video.paused) {
        expectPlayUntil = Date.now() + PENDING_EVENT_TIMEOUT_MS;
      }

      try {
        await video.play();
      } catch (error) {
        if (!isAutoplayBlockedError(error)) {
          expectPlayUntil = 0;
          throw error;
        }

        // Browsers block unmuted autoplay without a user gesture. Fall back to
        // a muted playback and let the UI ask the viewer to unmute.
        video.muted = true;
        callbacks.onAutoplayBlocked();

        if (video.paused) {
          expectPlayUntil = Date.now() + PENDING_EVENT_TIMEOUT_MS;
        }

        await video.play();
      }
    },
    pause() {
      if (!video.paused) {
        expectPauseUntil = Date.now() + PENDING_EVENT_TIMEOUT_MS;
      }

      video.pause();
    },
    seek(seconds) {
      const target = Math.max(0, seconds);

      pendingSeek =
        Math.abs(video.currentTime - target) > SEEK_MATCH_TOLERANCE_SECONDS
          ? { target, at: Date.now() }
          : null;

      video.currentTime = target;
    },
    setMuted(muted) {
      video.muted = muted;
    },
    destroy() {
      video.removeEventListener('loadedmetadata', markReady);
      video.removeEventListener('canplay', markReady);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('seeked', handleSeeked);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);

      video.pause();
      video.removeAttribute('src');
      video.load();
    },
  };
}

function isAutoplayBlockedError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'NotAllowedError';
}
