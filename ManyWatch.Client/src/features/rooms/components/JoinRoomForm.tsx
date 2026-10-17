import { type FormEvent, useState } from 'react';
import { joinRoom } from '../api/roomsApi';
import { useRoomAction } from '../hooks/useRoomAction';
import { LeaveCurrentRoomDialog } from './LeaveCurrentRoomDialog';

export function JoinRoomForm() {
  const [roomId, setRoomId] = useState('');
  const {
    pendingTarget,
    currentRoomName,
    isSubmitting,
    error,
    requestAction,
    confirmAction,
    cancelAction,
  } = useRoomAction<{ id: string }>({
    execute: (target) => joinRoom(target.id),
    errorMessage: 'Failed to join room',
    targetRoomId: (target) => target.id,
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await requestAction({ id: roomId.trim() });
  }

  return (
    <>
      <form className="form" onSubmit={handleSubmit}>
        <label>
          Room Id
          <input
            required
            value={roomId}
            onChange={(event) => setRoomId(event.target.value)}
            placeholder="Room Guid"
          />
        </label>

        {error && !pendingTarget && <p className="error">{error}</p>}

        <button disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Joining...' : 'Join room'}
        </button>
      </form>

      {pendingTarget && (
        <LeaveCurrentRoomDialog
          description={
            <>
              You are already in <strong>{currentRoomName}</strong>. Do you want to leave it and
              join the new room?
            </>
          }
          confirmLabel="Leave and join"
          isSubmitting={isSubmitting}
          error={error}
          onConfirm={() => void confirmAction()}
          onCancel={cancelAction}
        />
      )}
    </>
  );
}