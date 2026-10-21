import { type FormEvent, useState } from 'react';
import { renameRoom } from '../api/roomsApi';
import type { Room } from '../model/types';

type Props = {
  room: Room;
  onUpdated: (room: Room) => void;
};

export function RoomNameEditor({ room, onUpdated }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(room.name);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const trimmedName = name.trim();
  const canSave = trimmedName.length > 0 && trimmedName !== room.name && !isSaving;

  function startEditing() {
    setName(room.name);
    setError('');
    setIsEditing(true);
  }

  function cancelEditing() {
    setIsEditing(false);
    setError('');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSave) {
      return;
    }

    setError('');
    setIsSaving(true);

    try {
      onUpdated(await renameRoom(room.id, trimmedName));
      setIsEditing(false);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to rename the room');
    } finally {
      setIsSaving(false);
    }
  }

  if (!isEditing) {
    return (
      <div className="room-title">
        <h1>{room.name}</h1>
        <button type="button" className="secondary compact" onClick={startEditing}>
          Rename
        </button>
      </div>
    );
  }

  return (
    <form className="rename-form" onSubmit={handleSubmit}>
      <input
        autoFocus
        required
        maxLength={64}
        aria-label="Room name"
        value={name}
        onChange={(event) => setName(event.target.value)}
      />

      <button type="submit" className="compact" disabled={!canSave}>
        {isSaving ? 'Saving…' : 'Save'}
      </button>

      <button type="button" className="secondary compact" onClick={cancelEditing} disabled={isSaving}>
        Cancel
      </button>

      {error && <p className="error">{error}</p>}
    </form>
  );
}
