import { useCallback, useEffect, useRef, useState } from 'react';
import { HubConnection, HubConnectionState } from '@microsoft/signalr';
import { createFriendsHubConnection } from '../api/friendsHub';
import { mergeChatMessages } from '../../chat/model/messages';
import type { RoomConnectionStatus } from '../../playback/model/types';
import type { DirectMessage } from '../model/types';

const RECONNECT_DELAY_MS = 5_000;

type Options = {
  friendId: string;
  enabled: boolean;
};

type Result = {
  messages: DirectMessage[];
  status: RoomConnectionStatus;
  error: string;
  sendMessage: (content: string) => Promise<void>;
};

export function useFriendChat({ friendId, enabled }: Options): Result {
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [status, setStatus] = useState<RoomConnectionStatus>(
    enabled ? 'connecting' : 'disconnected',
  );
  const [error, setError] = useState('');
  const connectionRef = useRef<HubConnection | null>(null);

  useEffect(() => {
    if (!enabled || !friendId) {
      setMessages([]);
      setStatus('disconnected');
      setError('');
      return;
    }

    const connection = createFriendsHubConnection();
    connectionRef.current = connection;

    let disposed = false;
    let reconnectLoopActive = false;

    setMessages([]);
    setError('');
    setStatus('connecting');

    const mergeMessages = (incoming: DirectMessage[]) => {
      if (disposed) {
        return;
      }

      setMessages((current) => mergeChatMessages(current, incoming));
    };

    const loadHistory = async () => {
      const history = await connection.invoke<DirectMessage[]>('GetMessages', friendId);
      mergeMessages(history);
    };

    const connectAndLoad = async () => {
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
            await loadHistory();
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

    connection.on('DirectMessageReceived', (message: DirectMessage) => {
      if (message.senderId === friendId || message.recipientId === friendId) {
        mergeMessages([message]);
      }
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
      void loadHistory().catch((error) => {
        if (disposed) {
          return;
        }

        if (isHubError(error)) {
          setStatus('disconnected');
          return;
        }

        setStatus('reconnecting');
        void connectAndLoad();
      });
    });

    connection.onclose(() => {
      if (disposed) {
        return;
      }

      setStatus('reconnecting');
      void connectAndLoad();
    });

    void connectAndLoad();

    return () => {
      disposed = true;
      connectionRef.current = null;
      void connection.stop();
    };
  }, [enabled, friendId]);

  const sendMessage = useCallback(
    async (content: string) => {
      const connection = connectionRef.current;
      if (!connection || connection.state !== HubConnectionState.Connected) {
        setError('Chat is not connected. Check your connection');
        throw new Error('Chat is not connected');
      }

      setError('');

      try {
        await connection.invoke('SendMessage', friendId, { content });
      } catch (error) {
        setError('Message could not be sent. Check your connection');
        throw error;
      }
    },
    [friendId],
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
