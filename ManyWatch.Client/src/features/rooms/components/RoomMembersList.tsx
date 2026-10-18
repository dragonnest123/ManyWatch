import type { RoomMember } from '../model/types';

type Props = {
  members: RoomMember[];
  canModerate: boolean;
  onBan: (userId: string) => void;
};

export function RoomMembersList({ members, canModerate, onBan }: Props) {
  return (
    <section className="card members-card">
      <h2>Members</h2>

      {members.length === 0 ? (
        <p>No members yet.</p>
      ) : (
        <ul className="members">
          {members.map((member, index) => (
            <li key={member.userId}>
              <span>{member.isMe ? 'You' : `Viewer ${index + 1}`}</span>

              <span className="member-actions">
                {member.isHost && <strong>Host</strong>}
                {canModerate && !member.isMe && (
                  <button
                    className="danger compact"
                    type="button"
                    onClick={() => onBan(member.userId)}
                  >
                    Ban
                  </button>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
