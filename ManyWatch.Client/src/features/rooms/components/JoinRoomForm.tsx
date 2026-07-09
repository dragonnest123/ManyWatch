import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { joinRoom } from '../api/roomsApi';

export function JoinRoomForm() {
  const navigate = useNavigate();

  const [roomId, setRoomId] = useState('');
  const [userId, setUserId] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError('');
    setIsSubmitting(true);

    try {
      const room = await joinRoom(roomId, { userId });

      navigate(`/rooms/${room.id}?userId=${userId}`);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to join room');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <label>
        Room Id
        <input
          value={roomId}
          onChange={(event) => setRoomId(event.target.value)}
          placeholder="Room Guid"
        />
      </label>

      <label>
        User Id
        <input
          value={userId}
          onChange={(event) => setUserId(event.target.value)}
          placeholder="User Guid"
        />
      </label>

      {error && <p className="error">{error}</p>}

      <button disabled={isSubmitting} type="submit">
        {isSubmitting ? 'Joining...' : 'Join room'}
      </button>
    </form>
  );
}
