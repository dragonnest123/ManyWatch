import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCurrentRoom } from '../features/rooms/hooks/useCurrentRoom';

export function CurrentRoomBar() {
  const { currentRoom } = useCurrentRoom();
  const location = useLocation();
  const navigate = useNavigate();
  const [isDismissed, setIsDismissed] = useState(false);

  if (!currentRoom || isDismissed || location.pathname === `/rooms/${currentRoom.id}`) {
    return null;
  }

  return (
    <div className="current-room-bar">
      <span className="current-room-icon">▶</span>

      <div className="current-room-info">
        <p className="current-room-label">You're in a room</p>
        <p className="current-room-name">{currentRoom.name}</p>
      </div>

      <button
        className="secondary"
        type="button"
        onClick={() => navigate(`/rooms/${currentRoom.id}`)}
      >
        Return
      </button>

      <button
        className="current-room-dismiss"
        type="button"
        aria-label="Dismiss"
        onClick={() => setIsDismissed(true)}
      >
        ×
      </button>
    </div>
  );
}
