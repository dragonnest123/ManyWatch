import type { RoomMember } from '../model/types';
import { getViewerName } from '../model/viewerName';

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
          {members.map((member) => {
            const viewerName = getViewerName(member.userId, member.isMe);

            return (
              <li key={member.userId}>
                <span className="member-identity">
                  <span className="member-avatar" aria-hidden="true">
                    {getInitial(viewerName)}
                  </span>
                  <span>{viewerName}</span>
                </span>

                <span className="member-actions">
                  {member.isHost && <strong className="host-badge">Host</strong>}
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
            );
          })}
        </ul>
      )}
    </section>
  );
}

function getInitial(viewerName: string): string {
  return viewerName.trim().charAt(0).toUpperCase() || '?';
}
