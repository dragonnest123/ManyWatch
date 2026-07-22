import type { RoomMember } from '../model/types';

type Props = {
  currentUserId: string;
  members: RoomMember[];
};

export function RoomMembersList({ currentUserId, members }: Props) {
  return (
    <section className="card members-card">
      <h2>Members</h2>

      {members.length === 0 ? (
        <p>No members yet.</p>
      ) : (
        <ul className="members">
          {members.map((member, index) => (
            <li key={member.userId}>
              <span>{member.userId === currentUserId ? 'You' : `Viewer ${index + 1}`}</span>
              {member.isHost && <strong>Host</strong>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
