import { useContext } from 'react';
import { CurrentRoomContext, type CurrentRoomContextValue } from '../context/currentRoomContextInstance';

export function useCurrentRoom(): CurrentRoomContextValue {
  const context = useContext(CurrentRoomContext);

  if (!context) {
    throw new Error('useCurrentRoom must be used within a CurrentRoomProvider');
  }

  return context;
}
