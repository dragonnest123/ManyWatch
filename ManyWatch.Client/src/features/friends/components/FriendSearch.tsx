import { useState, type FormEvent } from 'react';
import type { FriendRelationship, UserSearchResult } from '../model/types';

const RELATIONSHIP_LABELS: Record<FriendRelationship, string> = {
  None: '',
  Friends: 'Friends',
  OutgoingRequest: 'Request sent',
  IncomingRequest: 'Wants to be friends',
};

type Props = {
  results: UserSearchResult[];
  isSearching: boolean;
  error: string;
  onSearch: (query: string) => Promise<void>;
  onAdd: (userId: string) => Promise<void>;
};

export function FriendSearch({ results, isSearching, error, onSearch, onAdd }: Props) {
  const [query, setQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const term = query.trim();
    if (term.length < 2 || isSearching) {
      return;
    }

    await onSearch(term);
    setHasSearched(true);
  }

  async function handleAdd(userId: string) {
    setPendingUserId(userId);

    try {
      await onAdd(userId);

      const term = query.trim();
      if (term.length >= 2) {
        await onSearch(term);
      }
    } catch {
      // The page exposes a user-facing action error.
    } finally {
      setPendingUserId(null);
    }
  }

  return (
    <section className="card friend-search-card">
      <h2>Find people</h2>

      <form className="friend-search-form" onSubmit={handleSubmit}>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Name or email"
          aria-label="Search people by name or email"
        />
        <button type="submit" disabled={isSearching || query.trim().length < 2}>
          {isSearching ? 'Searching...' : 'Search'}
        </button>
      </form>

      {error && <p className="error">{error}</p>}

      {hasSearched && !isSearching && results.length === 0 && (
        <p className="muted">No users found</p>
      )}

      {results.length > 0 && (
        <ul className="search-results">
          {results.map((result) => {
            const relationshipLabel = RELATIONSHIP_LABELS[result.relationship];

            return (
              <li key={result.userId} className="search-result">
                <span className="search-result-info">
                  <strong>{result.displayName}</strong>
                  <span className="muted">{result.email}</span>
                </span>

                {result.relationship === 'None' ? (
                  <button
                    type="button"
                    className="compact"
                    disabled={pendingUserId === result.userId}
                    onClick={() => void handleAdd(result.userId)}
                  >
                    {pendingUserId === result.userId ? 'Adding...' : 'Add friend'}
                  </button>
                ) : (
                  <span className="relationship-badge">{relationshipLabel}</span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
