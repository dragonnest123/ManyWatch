import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { buildAuthPath } from '../../auth/model/redirects';
import { useAuth } from '../../auth/hooks/useAuth';
import { UserAvatar } from '../../../shared/UserAvatar';
import { getFriends, sendRoomInvitation } from '../api/friendsApi';
import type { Friend } from '../model/types';

type Props = {
  roomId: string;
  enabled: boolean;
};

export function InviteFriendsCard({ roomId, enabled }: Props) {
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [invitedIds, setInvitedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingFriendId, setPendingFriendId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const userId = user?.id ?? null;

  useEffect(() => {
    setInvitedIds([]);
    setError('');

    if (!enabled || !userId) {
      setFriends([]);
      return;
    }

    let isCancelled = false;
    setIsLoading(true);

    getFriends()
      .then((loadedFriends) => {
        if (!isCancelled) {
          setFriends(loadedFriends);
        }
      })
      .catch((error: unknown) => {
        if (!isCancelled) {
          setError(error instanceof Error ? error.message : 'Failed to load friends');
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [enabled, roomId, userId]);

  if (!enabled) {
    return null;
  }

  async function handleInvite(friendId: string) {
    setPendingFriendId(friendId);
    setError('');

    try {
      await sendRoomInvitation(friendId, roomId);
      setInvitedIds((current) => [...current, friendId]);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Invitation could not be sent');
    } finally {
      setPendingFriendId(null);
    }
  }

  return (
    <section className="card invite-friends-card">
      <h2>Invite friends</h2>

      {!user ? (
        <p className="muted">
          <Link to={buildAuthPath('/login', `/rooms/${roomId}`)}>Log in</Link> to invite your
          friends
        </p>
      ) : isLoading ? (
        <p className="muted">Loading...</p>
      ) : friends.length === 0 ? (
        <p className="muted">
          No friends yet. <Link to="/friends">Find friends</Link>
        </p>
      ) : (
        <ul className="invite-list">
          {friends.map((friend) => {
            const isInvited = invitedIds.includes(friend.userId);

            return (
              <li key={friend.userId}>
                <span className="invite-friend">
                  <UserAvatar
                    className="friend-avatar"
                    displayName={friend.displayName}
                    avatarUrl={friend.avatarUrl}
                  />
                  <span>{friend.displayName}</span>
                </span>
                <button
                  type="button"
                  className={isInvited ? 'secondary compact' : 'compact'}
                  disabled={isInvited || pendingFriendId === friend.userId}
                  onClick={() => void handleInvite(friend.userId)}
                >
                  {isInvited
                    ? 'Invited'
                    : pendingFriendId === friend.userId
                      ? 'Inviting...'
                      : 'Invite'}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {error && <p className="error">{error}</p>}
    </section>
  );
}
