import { type FormEvent, useState } from 'react';
import { createRoom } from '../api/roomsApi';
import { useRoomAction } from '../hooks/useRoomAction';
import type { CreateRoomRequest } from '../model/types';
import { LeaveCurrentRoomDialog } from './LeaveCurrentRoomDialog';

export function CreateRoomForm() {
  const [name, setName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const {
    pendingTarget,
    currentRoomName,
    isSubmitting,
    error,
    requestAction,
    confirmAction,
    cancelAction,
  } = useRoomAction<CreateRoomRequest>({
    execute: (request) => createRoom(request),
    errorMessage: 'Failed to create room',
    targetRoomId: () => null,
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await requestAction({ name: name.trim(), isPrivate });
  }

  return (
    <>
      <form className="form" onSubmit={handleSubmit}>
        <label>
          Room name
          <input
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Movie night"
          />
        </label>

        <label className="checkbox">
          <input
            type="checkbox"
            checked={isPrivate}
            onChange={(event) => setIsPrivate(event.target.checked)}
          />
          Private room
        </label>

        {error && !pendingTarget && <p className="error">{error}</p>}

        <button disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Creating...' : 'Create room'}
        </button>
      </form>

      {pendingTarget && (
        <LeaveCurrentRoomDialog
          description={
            <>
              You are already in <strong>{currentRoomName}</strong>. Do you want to leave it and
              create the new room <strong>{pendingTarget.name}</strong>?
            </>
          }
          confirmLabel="Leave and create"
          submittingLabel="Creating..."
          isSubmitting={isSubmitting}
          error={error}
          onConfirm={() => void confirmAction()}
          onCancel={cancelAction}
        />
      )}
    </>
  );
}