import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { heartbeatRoom, joinRoom } from '../features/rooms/api/roomsApi';
import { useCurrentRoom } from '../features/rooms/hooks/useCurrentRoom';
import { ApiRequestError } from './httpClient';

const HEARTBEAT_INTERVAL_MS = 30_000;

export function RoomPresenceHeartbeat() {
  const { currentRoom, setCurrentRoom, clearCurrentRoom } = useCurrentRoom();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentRoom) {
      return;
    }

    const rejoinCurrentRoom = async () => {
      try {
        const room = await joinRoom(currentRoom.id);
        setCurrentRoom({ id: room.id, name: room.name });
      } catch (error) {
        if (!(error instanceof ApiRequestError)) {
          return;
        }

        if (error.status === 403) {
          clearCurrentRoom();
          navigate('/');
          return;
        }

        if (error.status === 404) {
          clearCurrentRoom();
        }
      }
    };

    const sendHeartbeat = () => {
      void heartbeatRoom(currentRoom.id).catch((error) => {
        if (error instanceof ApiRequestError && error.status === 404) {
          void rejoinCurrentRoom();
        }
      });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        sendHeartbeat();
      }
    };

    sendHeartbeat();
    const intervalId = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentRoom, setCurrentRoom, clearCurrentRoom, navigate]);

  return null;
}
