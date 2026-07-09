import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRoom } from '../api/roomsApi';

export function CreateRoomForm() {
  const navigate = useNavigate();

  const [hostId, setHostId] = useState('');
  const [name, setName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError('');
    setIsSubmitting(true);

    try {
      const room = await createRoom({
        hostId,
        name,
        isPrivate,
      });

      navigate(`/rooms/${room.id}?userId=${hostId}`);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create room');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <label>
        Host Id
        <input
          value={hostId}
          onChange={(event) => setHostId(event.target.value)}
          placeholder="00000000-0000-0000-0000-000000000000"
        />
      </label>

      <label>
        Room name
        <input
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

      {error && <p className="error">{error}</p>}

      <button disabled={isSubmitting} type="submit">
        {isSubmitting ? 'Creating...' : 'Create room'}
      </button>
    </form>
  );
}
