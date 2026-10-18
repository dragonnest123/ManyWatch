import { useCallback, useEffect, useRef, useState } from 'react';
import { HubConnection, HubConnectionState } from '@microsoft/signalr';
import { createRoomHubConnection } from '../api/roomPlaybackHub';
import type {
  PlaybackOrigin,
  PlaybackStateDto,
  PlaybackUpdate,
  RoomConnectionStatus,
} from '../model/types';

const PERIODIC_SYNC_INTERVAL_MS = 15_000;
const RECONNECT_DELAY_MS = 5_000;

type Options = {
  roomId: string;
  enabled: boolean;
  onPlaybackReceived: (state: PlaybackStateDto | null, origin: PlaybackOrigin) => void;
};

type Result = {
  status: RoomConnectionStatus;
  sendPlaybackUpdate: (update: PlaybackUpdate) => Promise<void>;
  requestPlaybackState: () => Promise<void>;
};

export function useRoomPlaybackSync({ roomId, enabled, onPlaybackReceived }: Options): Result {
  const [status, setStatus] = useState<RoomConnectionStatus>('connecting');
  const connectionRef = useRef<HubConnection | null>(null);
  const optionsRef = useRef({ roomId, onPlaybackReceived });
  optionsRef.current = { roomId, onPlaybackReceived };

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const connection = createRoomHubConnection();
    connectionRef.current = connection;

    let disposed = false;
    let reconnectLoopActive = false;

    const applyState = (state: PlaybackStateDto | null, origin: PlaybackOrigin) => {
      if (disposed) {
        return;
      }

      optionsRef.current.onPlaybackReceived(state, origin);
    };

    const joinRoom = async () => {
      const state = await connection.invoke<PlaybackStateDto | null>(
        'JoinRoom',
        optionsRef.current.roomId,
      );
      applyState(state, 'initial');
    };

    // Keeps trying to connect until the component unmounts. The initial start
    // and the give-up-after-automatic-reconnect case are both handled here;
    // zero-delay negotiations are not worth extra special casing.
    const connectAndJoin = async () => {
      if (reconnectLoopActive) {
        return;
      }

      reconnectLoopActive = true;

      try {
        while (!disposed) {
          try {
            if (connection.state === HubConnectionState.Disconnected) {
              setStatus('connecting');
              await connection.start();
            }
          } catch {
            if (disposed) {
              return;
            }

            setStatus('reconnecting');
            await delay(RECONNECT_DELAY_MS);
            continue;
          }

          if (disposed) {
            return;
          }

          setStatus('connected');

          try {
            await joinRoom();
            return;
          } catch (error) {
            if (disposed) {
              return;
            }

            // The server rejected the join (not a member anymore, room
            // deleted, ...). Retrying cannot fix that.
            if (isHubError(error)) {
              setStatus('disconnected');
              return;
            }

            setStatus('reconnecting');
            await delay(RECONNECT_DELAY_MS);
          }
        }
      } finally {
        reconnectLoopActive = false;
      }
    };

    connection.on('PlaybackUpdated', (state: PlaybackStateDto) => applyState(state, 'update'));

    connection.onreconnecting(() => {
      if (!disposed) {
        setStatus('reconnecting');
      }
    });

    connection.onreconnected(() => {
      if (disposed) {
        return;
      }

      setStatus('connected');
      // Groups are not restored automatically, so rejoin and pick up the
      // current playback state instead of trusting the stale local one.
      void joinRoom().catch(() => {});
    });

    connection.onclose(() => {
      if (disposed) {
        return;
      }

      setStatus('reconnecting');
      void connectAndJoin();
    });

    void connectAndJoin();

    return () => {
      disposed = true;
      connectionRef.current = null;
      void connection.stop();
    };
  }, [enabled, roomId]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const requestState = () => {
      const connection = connectionRef.current;
      if (!connection || connection.state !== HubConnectionState.Connected) {
        return;
      }

      void connection
        .invoke<PlaybackStateDto | null>('RequestPlaybackState', roomId)
        .then((state) => optionsRef.current.onPlaybackReceived(state, 'sync'))
        .catch(() => {});
    };

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        requestState();
      }
    }, PERIODIC_SYNC_INTERVAL_MS);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        requestState();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, roomId]);

  const sendPlaybackUpdate = useCallback(async (update: PlaybackUpdate) => {
    const connection = connectionRef.current;
    if (!connection || connection.state !== HubConnectionState.Connected) {
      throw new Error('Not connected to the room yet');
    }

    await connection.invoke('UpdatePlayback', optionsRef.current.roomId, update);
  }, []);

  const requestPlaybackState = useCallback(async () => {
    const connection = connectionRef.current;
    if (!connection || connection.state !== HubConnectionState.Connected) {
      throw new Error('Not connected to the room yet');
    }

    const state = await connection.invoke<PlaybackStateDto | null>(
      'RequestPlaybackState',
      optionsRef.current.roomId,
    );

    optionsRef.current.onPlaybackReceived(state, 'sync');
  }, []);

  return { status, sendPlaybackUpdate, requestPlaybackState };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function isHubError(error: unknown): boolean {
  return error instanceof Error && error.message.includes('HubException');
}
