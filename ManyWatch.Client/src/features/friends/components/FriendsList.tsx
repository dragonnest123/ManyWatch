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
        <p className="muted">No friends yet. Find people by name or email</p>
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
                <span className="friend-avatar" aria-hidden="true">
                  {getInitial(friend.displayName)}
                </span>
                <span className="friend-info">
                  <strong>{friend.displayName}</strong>
                  <span className="muted">{friend.email}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function getInitial(displayName: string): string {
  return displayName.trim().charAt(0).toUpperCase() || '?';
}
