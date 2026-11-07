import { UserAvatar } from '../../../shared/UserAvatar';
import type { Friend } from '../model/types';

type Props = {
  friends: Friend[];
  selectedFriendId: string | null;
  onSelect: (friend: Friend) => void;
};

export function FriendsList({ friends, selectedFriendId, onSelect }: Props) {
  return (
    <section className="card friends-card">
      <h2>
        Friends <span className="muted">{friends.length}</span>
      </h2>

      {friends.length === 0 ? (
        <p className="muted">No friends yet. Find people by name</p>
      ) : (
        <ul className="friends-list">
          {friends.map((friend) => (
            <li key={friend.userId}>
              <button
                type="button"
                className={`friend-select${friend.userId === selectedFriendId ? ' is-selected' : ''}`}
                aria-pressed={friend.userId === selectedFriendId}
                onClick={() => onSelect(friend)}
              >
                <UserAvatar
                  className="friend-avatar"
                  displayName={friend.displayName}
                  avatarUrl={friend.avatarUrl}
                />
                <span className="friend-info">
                  <span className="friend-name">
                    <strong>{friend.displayName}</strong>
                    {friend.isOnline && (
                      <span className="friend-online-dot" role="img" aria-label="Online" />
                    )}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

