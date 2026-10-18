import { type FormEvent, useEffect, useState } from 'react';
import { updateRoomSettings } from '../api/roomsApi';
import type { Room, RoomJoinPolicy } from '../model/types';

type Props = {
  room: Room;
  onUpdated: (room: Room) => void;
};

const MIN_MAX_MEMBERS = 2;
const MAX_MAX_MEMBERS = 500;

export function RoomSettingsForm({ room, onUpdated }: Props) {
  const [isPrivate, setIsPrivate] = useState(room.isPrivate);
  const [maxMembers, setMaxMembers] = useState(room.maxMembers?.toString() ?? '');
  const [joinPolicy, setJoinPolicy] = useState<RoomJoinPolicy>(room.joinPolicy);
  const [error, setError] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setIsPrivate(room.isPrivate);
    setMaxMembers(room.maxMembers?.toString() ?? '');
    setJoinPolicy(room.joinPolicy);
  }, [room]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsSaved(false);

    const trimmedMaxMembers = maxMembers.trim();
    const parsedMaxMembers = trimmedMaxMembers === '' ? null : Number(trimmedMaxMembers);

    if (
      parsedMaxMembers !== null &&
      (!Number.isInteger(parsedMaxMembers) ||
        parsedMaxMembers < MIN_MAX_MEMBERS ||
        parsedMaxMembers > MAX_MAX_MEMBERS)
    ) {
      setError(
        `Max participants must be a whole number between ${MIN_MAX_MEMBERS} and ${MAX_MAX_MEMBERS}`,
      );
      return;
    }

    setIsSaving(true);

    try {
      const updatedRoom = await updateRoomSettings(room.id, {
        isPrivate,
        maxMembers: parsedMaxMembers,
        joinPolicy,
      });
      onUpdated(updatedRoom);
      setIsSaved(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="card room-settings-card">
      <h2>Room settings</h2>

      <form className="form" onSubmit={handleSubmit}>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={isPrivate}
            onChange={(event) => {
              setIsPrivate(event.target.checked);
              setIsSaved(false);
            }}
          />
          Private room
        </label>
        <p className="muted">
          Private rooms cannot be joined from the rooms list — people enter through the link
        </p>

        <label>
          Max participants
          <input
            type="number"
            min={MIN_MAX_MEMBERS}
            max={MAX_MAX_MEMBERS}
            placeholder="No limit"
            value={maxMembers}
            onChange={(event) => {
              setMaxMembers(event.target.value);
              setIsSaved(false);
            }}
          />
        </label>
        <p className="muted">Includes the host. Leave empty for no limit</p>

        <label>
          Who can join
          <select
            value={joinPolicy}
            onChange={(event) => {
              setJoinPolicy(event.target.value as RoomJoinPolicy);
              setIsSaved(false);
            }}
          >
            <option value="Everyone">Anyone, including guests</option>
            <option value="AuthorizedOnly">Signed-in users only</option>
          </select>
        </label>

        {error && <p className="error">{error}</p>}
        {isSaved && !error && <p className="muted">Settings saved</p>}

        <button disabled={isSaving} type="submit">
          {isSaving ? 'Saving...' : 'Save settings'}
        </button>
      </form>
    </section>
  );
}
