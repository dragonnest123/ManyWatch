import { useCallback, useEffect, useRef, useState } from 'react';
import { HubConnection, HubConnectionState } from '@microsoft/signalr';
import { createRoomHubConnection, ROOM_CHAT_HUB_PATH } from '../../rooms/api/roomHub';
import type { RoomConnectionStatus } from '../../playback/model/types';
import { mergeChatMessages } from '../model/messages';
import type { ChatMessageDto } from '../model/types';

const RECONNECT_DELAY_MS = 5_000;

type Options = {
  roomId: string;
  enabled: boolean;
};

type Result = {
  messages: ChatMessageDto[];
  status: RoomConnectionStatus;
  error: string;
  sendMessage: (content: string) => Promise<void>;
};

export function useRoomChat({ roomId, enabled }: Options): Result {
  const [messages, setMessages] = useState<ChatMessageDto[]>([]);
  const [status, setStatus] = useState<RoomConnectionStatus>(
    enabled ? 'connecting' : 'disconnected',
  );
  const [error, setError] = useState('');
  const connectionRef = useRef<HubConnection | null>(null);

  useEffect(() => {
    if (!enabled) {
      setMessages([]);
      setStatus('disconnected');
      setError('');
      return;
    }

    const connection = createRoomHubConnection(ROOM_CHAT_HUB_PATH);
    connectionRef.current = connection;

    let disposed = false;
    let reconnectLoopActive = false;

    setMessages([]);
    setError('');
    setStatus('connecting');

    const mergeMessages = (incoming: ChatMessageDto[]) => {
      if (disposed) {
        return;
      }

      setMessages((current) => mergeChatMessages(current, incoming));
    };

    const loadHistory = async () => {
      const history = await connection.invoke<ChatMessageDto[]>('GetMessages', roomId);
      mergeMessages(history);
    };

    const joinAndLoad = async () => {
      await connection.invoke('JoinRoom', roomId);
      await loadHistory();
    };

    // Mirrors the playback connection: keep retrying until the component
    // unmounts, but stop immediately when the server rejects the room access.
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
            await joinAndLoad();
            return;
          } catch (error) {
            if (disposed) {
              return;
            }

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

    connection.on('ChatMessageReceived', (message: ChatMessageDto) => {
      mergeMessages([message]);
    });

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
      // Groups are not restored automatically, so rejoin and reload history
      // to pick up anything sent while the connection was down.
      void joinAndLoad().catch((error) => {
        if (disposed) {
          return;
        }

        if (isHubError(error)) {
          setStatus('disconnected');
          return;
        }

        setStatus('reconnecting');
        void connectAndJoin();
      });
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

  const sendMessage = useCallback(
    async (content: string) => {
      const connection = connectionRef.current;
      if (!connection || connection.state !== HubConnectionState.Connected) {
        setError('Chat is not connected. Check your connection');
        throw new Error('Chat is not connected');
      }

      setError('');

      try {
        await connection.invoke('SendMessage', roomId, { content });
      } catch (error) {
        setError('Message could not be sent. Check your connection');
        throw error;
      }
    },
    [roomId],
  );

  return { messages, status, error, sendMessage };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function isHubError(error: unknown): boolean {
  return error instanceof Error && error.message.includes('HubException');
}
