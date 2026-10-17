import { useCallback, useState, type ReactNode } from 'react';
import { CurrentRoomContext, type CurrentRoom } from './currentRoomContextInstance';

const CURRENT_ROOM_STORAGE_KEY = 'manywatch.currentRoom';

function readStoredCurrentRoom(): CurrentRoom | null {
  const raw = localStorage.getItem(CURRENT_ROOM_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as CurrentRoom | null;

    if (!parsed || typeof parsed.id !== 'string' || typeof parsed.name !== 'string') {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function CurrentRoomProvider({ children }: { children: ReactNode }) {
  const [currentRoom, setCurrentRoomState] = useState<CurrentRoom | null>(readStoredCurrentRoom);

  const setCurrentRoom = useCallback((room: CurrentRoom) => {
    setCurrentRoomState((previous) => {
      if (previous?.id === room.id && previous?.name === room.name) {
        return previous;
      }

      localStorage.setItem(CURRENT_ROOM_STORAGE_KEY, JSON.stringify(room));
      return room;
    });
  }, []);

  const clearCurrentRoom = useCallback(() => {
    setCurrentRoomState((previous) => {
      if (previous === null) {
        return previous;
      }

      localStorage.removeItem(CURRENT_ROOM_STORAGE_KEY);
      return null;
    });
  }, []);

  return (
    <CurrentRoomContext.Provider value={{ currentRoom, setCurrentRoom, clearCurrentRoom }}>
      {children}
    </CurrentRoomContext.Provider>
  );
}
