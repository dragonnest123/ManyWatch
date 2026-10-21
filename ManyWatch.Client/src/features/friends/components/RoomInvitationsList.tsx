import type { RoomInvitation } from '../model/types';

type Props = {
  invitations: RoomInvitation[];
  onJoin: (invitation: RoomInvitation) => Promise<void>;
  onDismiss: (invitation: RoomInvitation) => Promise<void>;
};

export function RoomInvitationsList({ invitations, onJoin, onDismiss }: Props) {
  return (
    <section className="card invitations-card">
      <h2>
        Room invitations <span className="muted">{invitations.length}</span>
      </h2>

      {invitations.length === 0 ? (
        <p className="muted">No room invitations</p>
      ) : (
        <ul className="request-list">
          {invitations.map((invitation) => (
            <li key={invitation.id} className="request-item invitation-item">
              <span className="search-result-info">
                <strong>{invitation.roomName}</strong>
                <span className="muted">From {invitation.senderDisplayName}</span>
              </span>

              <span className="request-actions">
                <button
                  type="button"
                  className="compact"
                  onClick={() => void onJoin(invitation)}
                >
                  Join
                </button>
                <button
                  type="button"
                  className="secondary compact"
                  onClick={() => void onDismiss(invitation)}
                >
                  Dismiss
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
