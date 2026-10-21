import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getFriendRequests,
  getFriends,
  getRoomInvitations,
} from '../api/friendsApi';
import { subscribeFriendsChanged } from '../model/friendsEvents';
import type { Friend, FriendRequests, RoomInvitation } from '../model/types';

const EMPTY_REQUESTS: FriendRequests = { incoming: [], outgoing: [] };

export function useFriendsData(enabled: boolean) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequests>(EMPTY_REQUESTS);
  const [invitations, setInvitations] = useState<RoomInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState('');
  const hasLoadedRef = useRef(false);

  const refresh = useCallback(async () => {
    if (!enabled) {
      return;
    }

    if (!hasLoadedRef.current) {
      setIsLoading(true);
    }

    setError('');

    try {
      const [nextFriends, nextRequests, nextInvitations] = await Promise.all([
        getFriends(),
        getFriendRequests(),
        getRoomInvitations(),
      ]);

      setFriends(nextFriends);
      setRequests(nextRequests);
      setInvitations(nextInvitations);
      hasLoadedRef.current = true;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load friends');
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!enabled) {
      hasLoadedRef.current = false;
      setFriends([]);
      setRequests(EMPTY_REQUESTS);
      setInvitations([]);
      setError('');
      setIsLoading(false);
      return;
    }

    return subscribeFriendsChanged(() => {
      void refresh();
    });
  }, [enabled, refresh]);

  return { friends, requests, invitations, isLoading, error, refresh };
}
