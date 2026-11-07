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
import { RoomSettingsDialog } from '../features/rooms/components/RoomSettingsDialog';
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
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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
            Back
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
          Back
        </Link>

        {error && <p className="error">{error}</p>}

        <section className="room-summary">
          <div>
            <div className="room-meta">
              <span className={`room-visibility ${room.isPrivate ? 'is-private' : 'is-public'}`}>
                {room.isPrivate ? 'Private screening' : 'Open screening'}
              </span>
              <span className="room-meta-item">
                {room.members.length}
                {room.maxMembers !== null ? ` / ${room.maxMembers}` : ''}{' '}
                {room.members.length === 1 ? 'viewer' : 'viewers'}
              </span>
            </div>

            {isCurrentUserHost ? (
              <RoomNameEditor room={room} onUpdated={setRoom} />
            ) : (
              <h1>{room.name}</h1>
            )}
          </div>

          <div className="actions room-actions">
            {isCurrentUserHost && (
              <button
                type="button"
                className="secondary icon-button"
                aria-label="Room settings"
                title="Room settings"
                onClick={() => setIsSettingsOpen(true)}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              </button>
            )}

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

        <section className="room-layout">
          <div className="watch-column">
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
            <ChatPanel
              roomId={room.id}
              viewerId={currentMember?.userId ?? null}
              enabled={isMember}
            />

            <InviteFriendsCard roomId={room.id} enabled={isMember} />

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

        {isCurrentUserHost && isSettingsOpen && (
          <RoomSettingsDialog
            room={room}
            onUpdated={setRoom}
            onClose={() => setIsSettingsOpen(false)}
          />
        )}
      </main>
    </>
  );
}
