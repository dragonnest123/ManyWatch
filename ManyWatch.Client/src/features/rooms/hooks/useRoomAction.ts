import { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { leaveRoom } from '../api/roomsApi';
import type { Room } from '../model/types';
import { useCurrentRoom } from './useCurrentRoom';

type RoomActionOptions<TTarget> = {
  execute: (target: TTarget) => Promise<Room>;
  errorMessage: string;
  targetRoomId: (target: TTarget) => string | null;
};

export function useRoomAction<TTarget>(options: RoomActionOptions<TTarget>) {
  const navigate = useNavigate();
  const { currentRoom, setCurrentRoom, clearCurrentRoom } = useCurrentRoom();

  const optionsRef = useRef(options);
  optionsRef.current = options;

  const [pendingTarget, setPendingTarget] = useState<TTarget | null>(null);
  const [submittingTarget, setSubmittingTarget] = useState<TTarget | null>(null);
  const [error, setError] = useState('');

  const isSubmitting = submittingTarget !== null;

  const executeAndOpen = useCallback(
    async (target: TTarget) => {
      const room = await optionsRef.current.execute(target);

      setCurrentRoom({ id: room.id, name: room.name });
      navigate(`/rooms/${room.id}`);
    },
    [navigate, setCurrentRoom],
  );

  const requestAction = useCallback(
    async (target: TTarget) => {
      setError('');

      if (currentRoom && optionsRef.current.targetRoomId(target) !== currentRoom.id) {
        setPendingTarget(target);
        return;
      }

      setSubmittingTarget(target);

      try {
        await executeAndOpen(target);
      } catch (error) {
        setError(error instanceof Error ? error.message : optionsRef.current.errorMessage);
      } finally {
        setSubmittingTarget(null);
      }
    },
    [currentRoom, executeAndOpen],
  );

  const confirmAction = useCallback(async () => {
    if (!pendingTarget) {
      return;
    }

    setError('');
    setSubmittingTarget(pendingTarget);

    try {
      if (currentRoom) {
        await leaveRoom(currentRoom.id);
        clearCurrentRoom();
      }

      await executeAndOpen(pendingTarget);
      setPendingTarget(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : optionsRef.current.errorMessage);
    } finally {
      setSubmittingTarget(null);
    }
  }, [pendingTarget, currentRoom, clearCurrentRoom, executeAndOpen]);

  const cancelAction = useCallback(() => {
    setPendingTarget(null);
    setError('');
  }, []);

  return {
    pendingTarget,
    submittingTarget,
    currentRoomName: currentRoom?.name ?? '',
    isSubmitting,
    error,
    requestAction,
    confirmAction,
    cancelAction,
  };
}