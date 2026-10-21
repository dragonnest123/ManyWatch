import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { createFriendsHubConnection } from '../api/friendsHub';
import { notifyFriendsChanged } from '../model/friendsEvents';
import type { Friend, FriendRequest, RoomInvitation } from '../model/types';

type Toast = {
  id: number;
  text: string;
};

const TOAST_LIFETIME_MS = 8_000;
const RECONNECT_DELAY_MS = 5_000;

export function FriendsNotifications() {
  const { user } = useAuth();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Set<number>>(new Set());

  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback(
    (text: string) => {
      const id = Date.now() + Math.random();
      setToasts((current) => [...current, { id, text }].slice(-3));

      const timer = window.setTimeout(() => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
        timersRef.current.delete(timer);
      }, TOAST_LIFETIME_MS);

      timersRef.current.add(timer);
    },
    [],
  );

  useEffect(() => {
    const timers = timersRef.current;

    return () => {
      for (const timer of timers) {
        window.clearTimeout(timer);
      }

      timers.clear();
    };
  }, []);

  const userId = user?.id ?? null;

  useEffect(() => {
    if (!userId) {
      setToasts([]);
      return;
    }

    const connection = createFriendsHubConnection();

    let disposed = false;
    let retryTimer: number | null = null;

    const scheduleRetry = () => {
      if (disposed || retryTimer !== null) {
        return;
      }

      retryTimer = window.setTimeout(() => {
        retryTimer = null;
        void start();
      }, RECONNECT_DELAY_MS);
    };

    const start = async () => {
      if (disposed) {
        return;
      }

      try {
        await connection.start();
      } catch {
        scheduleRetry();
      }
    };

    connection.on('FriendRequestReceived', (request: FriendRequest) => {
      notifyFriendsChanged();
      pushToast(`${request.displayName} sent you a friend request`);
    });

    connection.on('FriendRequestAccepted', (friend: Friend) => {
      notifyFriendsChanged();
      pushToast(`You are now friends with ${friend.displayName}`);
    });

    connection.on('FriendRequestRemoved', () => {
      notifyFriendsChanged();
    });

    connection.on('RoomInvitationReceived', (invitation: RoomInvitation) => {
      notifyFriendsChanged();
      pushToast(`${invitation.senderDisplayName} invited you to ${invitation.roomName}`);
    });

    connection.on('RoomInvitationAccepted', () => {
      notifyFriendsChanged();
      pushToast('A friend accepted your room invitation');
    });

    connection.on('RoomInvitationRemoved', () => {
      notifyFriendsChanged();
    });

    connection.on('FriendRemoved', () => {
      notifyFriendsChanged();
    });

    connection.onclose(() => {
      scheduleRetry();
    });

    void start();

    return () => {
      disposed = true;

      if (retryTimer !== null) {
        window.clearTimeout(retryTimer);
      }

      void connection.stop();
    };
  }, [pushToast, userId]);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="notifications-stack" aria-live="polite" aria-label="Friend notifications">
      {toasts.map((toast) => (
        <div key={toast.id} className="notification-toast">
          <p>{toast.text}</p>
          <div className="notification-actions">
            <Link to="/friends" onClick={() => dismissToast(toast.id)}>
              Open friends
            </Link>
            <button
              type="button"
              className="secondary compact"
              onClick={() => dismissToast(toast.id)}
            >
              Dismiss
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
