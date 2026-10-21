import type { BannedMember } from '../model/types';

type Props = {
  bans: BannedMember[];
  onUnban: (userId: string) => void;
};

export function BannedMembersList({ bans, onUnban }: Props) {
  return (
    <section className="card members-card">
      <h2>Banned</h2>

      {bans.length === 0 ? (
        <p className="muted">No banned viewers</p>
      ) : (
        <ul className="members">
          {bans.map((ban) => (
            <li key={ban.userId}>
              <span className="member-identity">
                <span className="member-avatar is-muted" aria-hidden="true">
                  ×
                </span>
                <span className="muted" title={ban.userId}>
                  Viewer {ban.userId.slice(0, 8)}
                </span>
              </span>

              <span className="member-actions">
                <button
                  className="secondary compact"
                  type="button"
                  onClick={() => onUnban(ban.userId)}
                >
                  Unban
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
