import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  banMember,
  deleteRoom,
  getRoom,
  joinRoom,
  leaveRoom,
  unbanMember,
} from '../features/rooms/api/roomsApi';
import { ChatPanel } from '../features/chat/components/ChatPanel';
import { BannedMembersList } from '../features/rooms/components/BannedMembersList';
import { RoomMembersList } from '../features/rooms/components/RoomMembersList';
import { InviteFriendsCard } from '../features/friends/components/InviteFriendsCard';
import { RoomNameEditor } from '../features/rooms/components/RoomNameEditor';
import { RoomSettingsForm } from '../features/rooms/components/RoomSettingsForm';
import { useCurrentRoom } from '../features/rooms/hooks/useCurrentRoom';
import type { Room } from '../features/rooms/model/types';
import { useAuth } from '../features/auth/hooks/useAuth';
import { buildAuthPath } from '../features/auth/model/redirects';
import { RoomPlayer } from '../features/playback/components/RoomPlayer';
import { AppHeader } from '../shared/AppHeader';

export function RoomPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();

  const { setCurrentRoom, clearCurrentRoom } = useCurrentRoom();
  const { user } = useAuth();

  const [room, setRoom] = useState<Room | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const currentMember = room?.members.find((member) => member.isMe);
  const isCurrentUserHost = currentMember?.isHost ?? false;
  const isMember = currentMember !== undefined;
  const isFull =
    room !== null && room.maxMembers !== null && room.members.length >= room.maxMembers;

  useEffect(() => {
    if (!roomId) {
      return;
    }

    let isCancelled = false;

    async function loadRoom() {
      setError('');
      setIsLoading(true);

      try {
        const loadedRoom = await getRoom(roomId!);
        if (!isCancelled) {
          setRoom(loadedRoom);
        }
      } catch (error) {
        if (!isCancelled) {
          setError(error instanceof Error ? error.message : 'Failed to load room');
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadRoom();

    return () => {
      isCancelled = true;
    };
  }, [roomId]);

  useEffect(() => {
    const isMember = room?.members.some((member) => member.isMe);

    if (isMember && room) {
      setCurrentRoom({ id: room.id, name: room.name });
    }
  }, [room, setCurrentRoom]);

  async function handleLeaveRoom() {
    if (!roomId) {
      return;
    }

    setIsLeaving(true);

    try {
      await leaveRoom(roomId);
      clearCurrentRoom();
      navigate('/');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to leave room');
    } finally {
      setIsLeaving(false);
    }
  }

  async function handleDeleteRoom() {
    if (!roomId) {
      return;
    }

    setIsLeaving(true);

    try {
      await deleteRoom(roomId);
      clearCurrentRoom();
      navigate('/');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete room');
    } finally {
      setIsLeaving(false);
    }
  }

  async function handleJoinRoom() {
    if (!roomId) {
      return;
    }

    setIsJoining(true);
    setError('');

    try {
      setRoom(await joinRoom(roomId));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to join room');
    } finally {
      setIsJoining(false);
    }
  }

  async function handleBan(userId: string) {
    if (!roomId) {
      return;
    }

    setError('');

    try {
      await banMember(roomId, userId);
      setRoom(await getRoom(roomId));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to ban viewer');
    }
  }

  async function handleUnban(userId: string) {
    if (!roomId) {
      return;
    }

    setError('');

    try {
      await unbanMember(roomId, userId);
      setRoom(await getRoom(roomId));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to unban viewer');
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

  if (!room) {
    return (
      <>
        <AppHeader />

        <main className="page">
          <Link className="back-link" to="/">
            ← Back
          </Link>
          <p className="error">{error || 'Room not found'}</p>
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

        {error && <p className="error">{error}</p>}

        <section className="room-layout">
          <div className="watch-column">
            <section className="card room-summary">
              <div>
                <p className="eyebrow">{room.isPrivate ? 'Private room' : 'Public room'}</p>
                {isCurrentUserHost ? (
                  <RoomNameEditor room={room} onUpdated={setRoom} />
                ) : (
                  <h1>{room.name}</h1>
                )}
              </div>

              <div className="actions">
                <button className="secondary" onClick={handleLeaveRoom} disabled={isLeaving}>
                  Leave room
                </button>

                {isCurrentUserHost && (
                  <button className="danger" onClick={handleDeleteRoom} disabled={isLeaving}>
                    Delete room
                  </button>
                )}
              </div>
            </section>

            {isMember ? (
              <RoomPlayer roomId={room.id} initialPlayback={room.playback ?? null} />
            ) : (
              <section className="video-stage" aria-label="Video player area">
                <div className="video-placeholder">
                  <span>▶</span>
                  <p>Join the room to watch together</p>
                  {room.isPrivate && (
                    <p className="muted">This is a private room. Only people with the link can join</p>
                  )}
                  {room.joinPolicy === 'AuthorizedOnly' && !user ? (
                    <p className="muted">
                      Only signed-in users can join.{' '}
                      <Link to={buildAuthPath('/login', `/rooms/${room.id}`)}>Log in</Link> to
                      enter
                    </p>
                  ) : isFull ? (
                    <p className="muted">
                      The room is full ({room.members.length}/{room.maxMembers})
                    </p>
                  ) : (
                    <button type="button" onClick={() => void handleJoinRoom()} disabled={isJoining}>
                      {isJoining ? 'Joining…' : 'Join room'}
                    </button>
                  )}
                </div>
              </section>
            )}
          </div>

          <aside className="room-sidebar">
            {isCurrentUserHost && <RoomSettingsForm room={room} onUpdated={setRoom} />}

            <InviteFriendsCard roomId={room.id} enabled={isMember} />

            <ChatPanel
              roomId={room.id}
              viewerId={currentMember?.userId ?? null}
              enabled={isMember}
            />

            <RoomMembersList
              members={room.members}
              maxMembers={room.maxMembers}
              canModerate={isCurrentUserHost}
              onBan={handleBan}
            />

            {isCurrentUserHost && (
              <BannedMembersList bans={room.bans} onUnban={handleUnban} />
            )}
          </aside>
        </section>
      </main>
    </>
  );
}
