import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useRoomPlaybackSync } from '../hooks/useRoomPlaybackSync';
import type {
  PlaybackOrigin,
  PlaybackState,
  PlaybackStateDto,
  PlaybackUpdate,
  RoomConnectionStatus,
} from '../model/types';
import { getProviderLabel, parseVideoUrl, type VideoSource } from '../model/videoSource';
import { planPlaybackSync, snapshotPlayer } from '../model/syncPolicy';
import { createNativeVideoController } from '../players/nativeVideoPlayer';
import type { PlayerCallbacks, PlayerController } from '../players/types';
import { createYouTubePlayerController } from '../players/youtubePlayer';

type Props = {
  roomId: string;
  initialPlayback: PlaybackStateDto | null;
};

const STATUS_LABELS: Record<RoomConnectionStatus, string> = {
  connecting: 'Connecting…',
  connected: 'Live',
  reconnecting: 'Reconnecting…',
  disconnected: 'Offline',
};

export function RoomPlayer({ roomId, initialPlayback }: Props) {
  const [source, setSource] = useState<VideoSource | null>(() =>
    initialPlayback?.videoUrl ? parseVideoUrl(initialPlayback.videoUrl) : null,
  );
  const [urlDraft, setUrlDraft] = useState('');
  const [error, setError] = useState('');
  const [needsUnmute, setNeedsUnmute] = useState(false);

  const sourceRef = useRef<VideoSource | null>(source);
  sourceRef.current = source;

  const videoElementRef = useRef<HTMLVideoElement>(null);
  const youtubeHostRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<PlayerController | null>(null);
  const pendingApplyRef = useRef<{ state: PlaybackState; origin: PlaybackOrigin } | null>(null);
  const initialAppliedRef = useRef(false);

  // -- Playback state application ------------------------------------------

  const startPlayback = useCallback((controller: PlayerController) => {
    void controller.play().catch(() => {
      // Start failures are surfaced through the autoplay overlay or onError.
    });
  }, []);

  const applyToController = useCallback(
    (controller: PlayerController, state: PlaybackState, origin: PlaybackOrigin) => {
      const plan = planPlaybackSync(state, origin, snapshotPlayer(controller), Date.now());

      // Pause before seeking (mirrors the original order: stop playback, then
      // jump); when starting, seek to the target first and play afterwards.
      if (plan.pause) {
        controller.pause();
      }

      if (plan.seek) {
        controller.seek(plan.targetSeconds);
      }

      if (plan.play) {
        startPlayback(controller);
      }
    },
    [startPlayback],
  );

  const applyState = useCallback(
    (state: PlaybackState, origin: PlaybackOrigin) => {
      const parsed = parseVideoUrl(state.videoUrl ?? '');
      if (!parsed) {
        setError(
          'This video link cannot be played here. Use a direct video file link or a YouTube link',
        );
        return;
      }

      if (!sourceRef.current || sourceRef.current.url !== parsed.url) {
        pendingApplyRef.current = { state, origin };
        setNeedsUnmute(false);
        setSource(parsed);
        return;
      }

      const controller = controllerRef.current;
      if (!controller || !controller.ready) {
        pendingApplyRef.current = { state, origin };
        return;
      }

      applyToController(controller, state, origin);
    },
    [applyToController],
  );

  const handlePlaybackReceived = useCallback(
    (state: PlaybackStateDto | null, origin: PlaybackOrigin) => {
      if (!state || !state.videoUrl) {
        pendingApplyRef.current = null;
        setSource(null);
        return;
      }

      applyState({ ...state, receivedAtMs: Date.now() }, origin);
    },
    [applyState],
  );

  const { status, sendPlaybackUpdate, requestPlaybackState } = useRoomPlaybackSync({
    roomId,
    enabled: true,
    onPlaybackReceived: handlePlaybackReceived,
  });

  // -- Local user actions ---------------------------------------------------

  const sendLocalUpdate = useCallback(
    (positionSeconds: number, isPlaying: boolean) => {
      const currentSource = sourceRef.current;
      if (!currentSource) {
        return;
      }

      const update: PlaybackUpdate = {
        videoUrl: currentSource.url,
        isPlaying,
        positionSeconds: Math.max(0, positionSeconds),
        durationSeconds: controllerRef.current?.duration() ?? 0,
      };

      void sendPlaybackUpdate(update).catch(() => {
        setError('Playback could not be synchronized with the room. Check your connection');
      });
    },
    [sendPlaybackUpdate],
  );

  const handleEnded = useCallback(() => {
    const currentSource = sourceRef.current;
    if (!currentSource) {
      return;
    }

    const duration = controllerRef.current?.duration() ?? 0;

    void sendPlaybackUpdate({
      videoUrl: currentSource.url,
      isPlaying: false,
      positionSeconds: duration,
      durationSeconds: duration,
    }).catch(() => {});
  }, [sendPlaybackUpdate]);

  async function handleUrlSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsed = parseVideoUrl(urlDraft);
    if (!parsed) {
      setError('Enter a link to a video file (mp4/webm) or a YouTube video');
      return;
    }

    setError('');

    try {
      await sendPlaybackUpdate({
        videoUrl: parsed.url,
        isPlaying: false,
        positionSeconds: 0,
        durationSeconds: 0,
      });
      setUrlDraft('');
    } catch {
      setError('The video could not be changed. Check your connection and try again');
    }
  }

  async function handleResync() {
    setError('');

    try {
      await requestPlaybackState();
    } catch {
      setError('Could not synchronize playback. Check your connection');
    }
  }

  function handleEnableSound() {
    setNeedsUnmute(false);

    const controller = controllerRef.current;
    if (!controller) {
      return;
    }

    controller.setMuted(false);

    if (controller.isPaused()) {
      startPlayback(controller);
    }
  }

  // -- Player lifecycle -----------------------------------------------------

  useEffect(() => {
    if (!source) {
      return;
    }

    const callbacks: PlayerCallbacks = {
      onReady: () => {
        const pending = pendingApplyRef.current;
        const controller = controllerRef.current;
        if (!pending || !controller) {
          return;
        }

        pendingApplyRef.current = null;
        applyToController(controller, pending.state, pending.origin);
      },
      onUserPlay: (positionSeconds) => sendLocalUpdate(positionSeconds, true),
      onUserPause: (positionSeconds) => sendLocalUpdate(positionSeconds, false),
      onUserSeek: (positionSeconds) =>
        sendLocalUpdate(positionSeconds, !(controllerRef.current?.isPaused() ?? true)),
      onEnded: handleEnded,
      onAutoplayBlocked: () => setNeedsUnmute(true),
      onError: (message) => setError(message),
    };

    let controller: PlayerController | null = null;

    if (source.provider === 'direct' && videoElementRef.current) {
      controller = createNativeVideoController(videoElementRef.current, source.url, callbacks);
    } else if (source.provider === 'youtube' && youtubeHostRef.current) {
      controller = createYouTubePlayerController(youtubeHostRef.current, source.videoId, callbacks);
    }

    controllerRef.current = controller;

    return () => {
      controller?.destroy();
      if (controllerRef.current === controller) {
        controllerRef.current = null;
      }
    };
  }, [source, applyToController, handleEnded, sendLocalUpdate]);

  useEffect(() => {
    if (initialAppliedRef.current) {
      return;
    }

    initialAppliedRef.current = true;

    if (initialPlayback) {
      handlePlaybackReceived(initialPlayback, 'initial');
    }
  }, [initialPlayback, handlePlaybackReceived]);

  // -- Rendering ------------------------------------------------------------

  return (
    <>
      <section className="video-stage" aria-label="Video player area">
        {source ? (
          <div className="player-viewport">
            {source.provider === 'direct' ? (
              <video
                ref={videoElementRef}
                className="player-video"
                controls
                playsInline
                preload="metadata"
              />
            ) : (
              <div ref={youtubeHostRef} className="player-youtube-host" />
            )}
          </div>
        ) : (
          <div className="video-placeholder">
            <span>▶</span>
            <p>No video selected yet</p>
            <p className="muted">Paste a link below to start watching together</p>
          </div>
        )}

        {source && needsUnmute && (
          <button className="player-overlay" type="button" onClick={handleEnableSound}>
            <span className="player-overlay-icon" aria-hidden="true">
              🔊
            </span>
            Click to enable sound
          </button>
        )}

        {source && status !== 'connected' && (
          <div className="player-status-banner">{STATUS_LABELS[status]}</div>
        )}
      </section>

      <section className="card player-panel">
        <div className="player-panel-header">
          <h2>Video</h2>
          <span className={`connection-chip ${status}`}>{STATUS_LABELS[status]}</span>
        </div>

        <Link className="help-link" to="/help">
          What can we watch together?
        </Link>

        {error && <p className="error">{error}</p>}

        <form className="video-source-form" onSubmit={handleUrlSubmit}>
          <label>
            {source ? 'Change the video for everyone' : 'Video link'}
            <input
              type="url"
              value={urlDraft}
              onChange={(event) => setUrlDraft(event.target.value)}
              placeholder="https://youtu.be/... or https://example.com/movie.mp4"
            />
          </label>

          <button type="submit" disabled={status !== 'connected' || urlDraft.trim().length === 0}>
            {source ? 'Change video' : 'Watch together'}
          </button>
        </form>

        {source && (
          <div className="player-meta">
            <span className="muted player-meta-label" title={source.url}>
              Now playing: {getProviderLabel(source)} · {source.url}
            </span>
            <button
              className="secondary compact"
              type="button"
              onClick={() => void handleResync()}
              disabled={status !== 'connected'}
            >
              Resync
            </button>
          </div>
        )}
      </section>
    </>
  );
}
