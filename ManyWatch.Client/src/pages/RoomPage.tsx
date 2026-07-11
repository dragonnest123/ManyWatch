import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { deleteRoom, getRoom, leaveRoom } from '../features/rooms/api/roomsApi';
import { RoomMembersList } from '../features/rooms/components/RoomMembersList';
import type { Room } from '../features/rooms/model/types';
import { AppHeader } from '../shared/AppHeader';
import { getCurrentUserId } from '../shared/currentUser';

export function RoomPage() {
  const { roomId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const currentUserId = searchParams.get('userId') ?? getCurrentUserId();

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
      await leaveRoom(roomId, currentUserId);
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
      await deleteRoom(roomId, currentUserId);
      navigate('/');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete room');
    }
  }

  if (isLoading) {
    return (
      <>
        <AppHeader />

        <main className="page">
          <p>Loading...</p>
        </main>
      </>
    );
  }

  if (error) {
    return (
      <>
        <AppHeader />

        <main className="page">
          <Link className="back-link" to="/">
            ← Back
          </Link>
          <p className="error">{error}</p>
        </main>
      </>
    );
  }

  if (!room) {
    return (
      <>
        <AppHeader />

        <main className="page">
          <Link className="back-link" to="/">
            ← Back
          </Link>
          <p>Room not found.</p>
        </main>
      </>
    );
  }

  return (
    <>
      <AppHeader />

      <main className="page room-page">
        <Link className="back-link" to="/">
          ← Back
        </Link>

        <section className="room-layout">
          <div className="watch-column">
            <section className="card room-summary">
              <div>
                <p className="eyebrow">{room.isPrivate ? 'Private room' : 'Public room'}</p>
                <h1>{room.name}</h1>
              </div>

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

            <section className="video-stage" aria-label="Video player area">
              <div className="video-placeholder">
                <span>▶</span>
                <p>Video will appear here</p>
              </div>
            </section>
          </div>

          <aside className="room-sidebar">
            <section className="card chat-card">
              <h2>Chat</h2>
              <div className="chat-messages">
                <p className="muted">Chat messages will appear here.</p>
              </div>
              <form className="chat-form">
                <input placeholder="Write a message..." type="text" />
                <button type="button">Send</button>
              </form>
            </section>

            <RoomMembersList currentUserId={currentUserId} members={room.members} />
          </aside>
        </section>
      </main>
    </>
  );
}
