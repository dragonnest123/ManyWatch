import type { RoomMember } from '../model/types';

type Props = {
  members: RoomMember[];
};

export function RoomMembersList({ members }: Props) {
  return (
    <section className="card">
      <h2>Members</h2>

      {members.length === 0 ? (
        <p>No members yet.</p>
      ) : (
        <ul className="members">
          {members.map((member) => (
            <li key={member.userId}>
              <span>{member.userId}</span>
              {member.isHost && <strong>Host</strong>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
