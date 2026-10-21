import { UserAvatar } from '../../../shared/UserAvatar';
import type { FriendRequest, FriendRequests } from '../model/types';

type Props = {
  requests: FriendRequests;
  onAccept: (requestId: string) => Promise<void>;
  onDecline: (requestId: string) => Promise<void>;
  onCancel: (requestId: string) => Promise<void>;
};

export function FriendRequestsList({ requests, onAccept, onDecline, onCancel }: Props) {
  const hasRequests = requests.incoming.length > 0 || requests.outgoing.length > 0;

  return (
    <section className="card friend-requests-card">
      <h2>Friend requests</h2>

      {!hasRequests ? (
        <p className="muted">No pending requests</p>
      ) : (
        <>
          {requests.incoming.length > 0 && (
            <div className="request-group">
              <h3>Incoming</h3>
              <ul className="request-list">
                {requests.incoming.map((request) => (
                  <li key={request.id} className="request-item">
                    <RequestUser request={request} />

                    <span className="request-actions">
                      <button
                        type="button"
                        className="compact"
                        onClick={() => void onAccept(request.id)}
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        className="secondary compact"
                        onClick={() => void onDecline(request.id)}
                      >
                        Decline
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {requests.outgoing.length > 0 && (
            <div className="request-group">
              <h3>Sent</h3>
              <ul className="request-list">
                {requests.outgoing.map((request) => (
                  <li key={request.id} className="request-item">
                    <RequestUser request={request} />

                    <button
                      type="button"
                      className="secondary compact"
                      onClick={() => void onCancel(request.id)}
                    >
                      Cancel
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function RequestUser({ request }: { request: FriendRequest }) {
  return (
    <span className="search-result-user">
      <UserAvatar
        className="friend-avatar"
        displayName={request.displayName}
        avatarUrl={request.avatarUrl}
      />
      <span className="search-result-info">
        <strong>{request.displayName}</strong>
        <span className="muted">{request.email}</span>
      </span>
    </span>
  );
}
