import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/hooks/useAuth';
import { buildAuthPath } from '../features/auth/model/redirects';
import {
  acceptFriendRequest,
  acceptRoomInvitation,
  deleteFriendRequest,
  deleteRoomInvitation,
  removeFriend,
  searchUsers,
  sendFriendRequest,
} from '../features/friends/api/friendsApi';
import { FriendChatPanel } from '../features/friends/components/FriendChatPanel';
import { FriendRequestsList } from '../features/friends/components/FriendRequestsList';
import { FriendSearch } from '../features/friends/components/FriendSearch';
import { FriendsList } from '../features/friends/components/FriendsList';
import { RoomInvitationsList } from '../features/friends/components/RoomInvitationsList';
import { useFriendsData } from '../features/friends/hooks/useFriendsData';
import type { Friend, RoomInvitation, UserSearchResult } from '../features/friends/model/types';
import { AppHeader } from '../shared/AppHeader';

export function FriendsPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();

  const { friends, requests, invitations, isLoading, error, refresh } = useFriendsData(
    Boolean(user),
  );

  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [actionError, setActionError] = useState('');

  const selectedFriend = friends.find((friend) => friend.userId === selectedFriendId) ?? null;

  useEffect(() => {
    if (selectedFriendId && !friends.some((friend) => friend.userId === selectedFriendId)) {
      setSelectedFriendId(null);
    }
  }, [friends, selectedFriendId]);

  if (isAuthLoading) {
    return (
      <>
        <AppHeader />

        <main className="page">
          <p>Loading...</p>
        </main>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <AppHeader />

        <main className="page form-page">
          <Link className="back-link" to="/">
            ← Back
          </Link>

          <section className="card">
            <p className="eyebrow">Social</p>
            <h1>Friends</h1>
            <p className="muted">
              Friend lists, personal chats and room invitations are available after signing in
            </p>

            <div className="actions">
              <Link className="button" to={buildAuthPath('/login', '/friends')}>
                Log in
              </Link>
              <Link className="button secondary" to={buildAuthPath('/register', '/friends')}>
                Sign up
              </Link>
            </div>
          </section>
        </main>
      </>
    );
  }

  async function handleSearch(query: string) {
    setIsSearching(true);
    setSearchError('');

    try {
      setSearchResults(await searchUsers(query));
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : 'Search failed');
    } finally {
      setIsSearching(false);
    }
  }

  async function handleAddFriend(userId: string) {
    setActionError('');

    try {
      await sendFriendRequest(userId);
      await refresh();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Friend request could not be sent');
      throw error;
    }
  }

  async function handleAcceptRequest(requestId: string) {
    setActionError('');

    try {
      await acceptFriendRequest(requestId);
      await refresh();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Request could not be accepted');
    }
  }

  async function handleDeclineRequest(requestId: string) {
    setActionError('');

    try {
      await deleteFriendRequest(requestId);
      await refresh();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Request could not be declined');
    }
  }

  async function handleJoinInvitation(invitation: RoomInvitation) {
    setActionError('');

    try {
      const accepted = await acceptRoomInvitation(invitation.id);
      navigate(`/rooms/${accepted.roomId}`);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Invitation could not be accepted');
    }
  }

  async function handleDismissInvitation(invitation: RoomInvitation) {
    setActionError('');

    try {
      await deleteRoomInvitation(invitation.id);
      await refresh();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Invitation could not be dismissed');
    }
  }

  async function handleRemoveFriend(friend: Friend) {
    if (!window.confirm(`Remove ${friend.displayName} from friends?`)) {
      return;
    }

    setActionError('');

    try {
      await removeFriend(friend.userId);
      await refresh();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Friend could not be removed');
    }
  }

  return (
    <>
      <AppHeader />

      <main className="page friends-page">
        <Link className="back-link" to="/rooms">
          ← Rooms
        </Link>

        <div className="friends-heading">
          <div>
            <p className="eyebrow">Social</p>
            <h1>Friends</h1>
          </div>
          <p className="muted">Invite friends to rooms and chat one on one</p>
        </div>

        {(actionError || error) && <p className="error">{actionError || error}</p>}

        <section className="friends-layout">
          <div className="friends-sidebar">
            <FriendSearch
              results={searchResults}
              isSearching={isSearching}
              error={searchError}
              onSearch={handleSearch}
              onAdd={handleAddFriend}
            />

            <FriendsList
              friends={friends}
              selectedFriendId={selectedFriend?.userId ?? null}
              onSelect={(friend) => setSelectedFriendId(friend.userId)}
            />

            <FriendRequestsList
              requests={requests}
              onAccept={handleAcceptRequest}
              onDecline={handleDeclineRequest}
              onCancel={handleDeclineRequest}
            />

            <RoomInvitationsList
              invitations={invitations}
              onJoin={handleJoinInvitation}
              onDismiss={handleDismissInvitation}
            />
          </div>

          <div className="friends-main">
            {isLoading ? (
              <section className="card friend-chat-placeholder">
                <p>Loading...</p>
              </section>
            ) : selectedFriend ? (
              <FriendChatPanel
                key={selectedFriend.userId}
                friend={selectedFriend}
                viewerId={user.id}
                onRemoveFriend={() => void handleRemoveFriend(selectedFriend)}
              />
            ) : (
              <section className="card friend-chat-placeholder">
                <h2>Personal chat</h2>
                <p className="muted">Select a friend to start chatting</p>
              </section>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
