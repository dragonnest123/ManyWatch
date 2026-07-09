import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { deleteRoom, getRoom, leaveRoom } from '../features/rooms/api/roomsApi';
import { RoomMembersList } from '../features/rooms/components/RoomMembersList';
import type { Room } from '../features/rooms/model/types';

export function RoomPage() {
  const { roomId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const currentUserId = searchParams.get('userId') ?? '';

  const [room, setRoom] = useState<Room | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const currentMember = room?.members.find((member) => member.userId === currentUserId);
  const isCurrentUserHost = currentMember?.isHost ?? false;

  useEffect(() => {
    if (!roomId) {
      return;
    }

    async function loadRoom() {
      setError('');
      setIsLoading(true);

      try {
        const loadedRoom = await getRoom(roomId!);
        setRoom(loadedRoom);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to load room');
      } finally {
        setIsLoading(false);
      }
    }

    void loadRoom();
  }, [roomId]);

  async function handleLeaveRoom() {
    if (!roomId || !currentUserId) {
      setError('Current user id is missing.');
      return;
    }

    try {
      await leaveRoom(roomId, { userId: currentUserId });
      navigate('/');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to leave room');
    }
  }

  async function handleDeleteRoom() {
    if (!roomId || !currentUserId) {
      setError('Current user id is missing.');
      return;
    }

    try {
      await deleteRoom(roomId, { userId: currentUserId });
      navigate('/');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete room');
    }
  }

  if (isLoading) {
    return (
      <main className="page">
        <p>Loading...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="page">
        <Link to="/">← Back</Link>
        <p className="error">{error}</p>
      </main>
    );
  }

  if (!room) {
    return (
      <main className="page">
        <Link to="/">← Back</Link>
        <p>Room not found.</p>
      </main>
    );
  }

  return (
    <main className="page">
      <Link to="/">← Back</Link>

      <section className="card">
        <h1>{room.name}</h1>

        <p>
          <strong>Room Id:</strong> {room.id}
        </p>

        <p>
          <strong>Type:</strong> {room.isPrivate ? 'Private' : 'Public'}
        </p>

        <p>
          <strong>Created:</strong> {new Date(room.createdAt).toLocaleString()}
        </p>

        {currentUserId && (
          <p>
            <strong>Your User Id:</strong> {currentUserId}
          </p>
        )}

        <div className="actions">
          <button className="secondary" onClick={handleLeaveRoom}>
            Leave room
          </button>

          {isCurrentUserHost && (
            <button className="danger" onClick={handleDeleteRoom}>
              Delete room
            </button>
          )}
        </div>
      </section>

      <RoomMembersList members={room.members} />
    </main>
  );
}
