import { createContext } from 'react';

export type CurrentRoom = {
  id: string;
  name: string;
};

export type CurrentRoomContextValue = {
  currentRoom: CurrentRoom | null;
  setCurrentRoom: (room: CurrentRoom) => void;
  clearCurrentRoom: () => void;
};

export const CurrentRoomContext = createContext<CurrentRoomContextValue | null>(null);
