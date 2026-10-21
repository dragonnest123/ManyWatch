type Listener = () => void;

const listeners = new Set<Listener>();

/**
 * Keeps the friends page in sync with real-time events from the global
 * notification connection without sharing a SignalR connection between screens.
 */
export function notifyFriendsChanged(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeFriendsChanged(listener: Listener): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}
