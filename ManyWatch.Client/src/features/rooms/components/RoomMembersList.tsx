import type { RoomMember } from '../model/types';

type Props = {
  members: RoomMember[];
  maxMembers: number | null;
  canModerate: boolean;
  onBan: (userId: string) => void;
};

export function RoomMembersList({ members, maxMembers, canModerate, onBan }: Props) {
  return (
    <section className="card members-card">
      <h2>
        Members{' '}
        <span className="muted">
          {maxMembers !== null ? `${members.length} / ${maxMembers}` : members.length}
        </span>
      </h2>

      {members.length === 0 ? (
        <p>No members yet</p>
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
