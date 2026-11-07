import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../features/auth/hooks/useAuth';
import { buildAuthPath } from '../features/auth/model/redirects';
import { sendFriendRequest } from '../features/friends/api/friendsApi';
import { getPublicProfile } from '../features/profile/api/profileApi';
import { formatProfileDate } from '../features/profile/model/format';
import type { PublicProfile } from '../features/profile/model/types';
import { AppHeader } from '../shared/AppHeader';
import { UserAvatar } from '../shared/UserAvatar';

export function PublicProfilePage() {
  const { username } = useParams();
  const { user } = useAuth();

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!username) {
      setError('Profile was not found');
      setIsLoading(false);
      return;
    }

    let isCancelled = false;
    setIsLoading(true);
    setError('');
    setActionError('');

    getPublicProfile(username)
      .then((loadedProfile) => {
        if (!isCancelled) {
          setProfile(loadedProfile);
        }
      })
      .catch((loadError: unknown) => {
        if (!isCancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Failed to load profile');
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [username]);

  async function handleAddFriend() {
    if (!profile) {
      return;
    }

    setIsSending(true);
    setActionError('');

    try {
      await sendFriendRequest(profile.userId);
      setProfile((current) =>
        current ? { ...current, relationship: 'OutgoingRequest' } : current,
      );
    } catch (sendError) {
      setActionError(
        sendError instanceof Error ? sendError.message : 'Friend request could not be sent',
      );
    } finally {
      setIsSending(false);
    }
  }

  const redirectPath = username ? `/users/${username}` : '/';

  return (
    <>
      <AppHeader />

      <main className="page profile-page public-profile-page">
        <Link className="back-link" to={user ? '/friends' : '/rooms'}>
          Back
        </Link>

        {isLoading ? (
          <section className="card public-profile-card">
            <p>Loading...</p>
          </section>
        ) : profile ? (
          <section className="card public-profile-card">
            <UserAvatar
              className="profile-avatar"
              displayName={profile.displayName}
              avatarUrl={profile.avatarUrl}
            />

            <div>
              <p className="eyebrow">Viewer profile</p>
              <h1>{profile.displayName}</h1>
              <p className="profile-handle">@{profile.username}</p>
            </div>

            <p className={profile.bio ? 'profile-bio' : 'muted'}>
              {profile.bio || 'No bio yet'}
            </p>

            <p className="public-profile-meta">
              <span>
                {profile.friendCount} {profile.friendCount === 1 ? 'friend' : 'friends'}
              </span>
              <span>Member since {formatProfileDate(profile.createdAt)}</span>
            </p>

            {actionError && <p className="error">{actionError}</p>}

            <div className="public-profile-actions">
              {profile.isSelf ? (
                <Link className="button" to="/profile">
                  Edit your profile
                </Link>
              ) : !user ? (
                <Link className="button" to={buildAuthPath('/login', redirectPath)}>
                  Log in to add friend
                </Link>
              ) : profile.relationship === 'None' ? (
                <button type="button" disabled={isSending} onClick={() => void handleAddFriend()}>
                  {isSending ? 'Sending...' : 'Add friend'}
                </button>
              ) : (
                <>
                  <span className="relationship-badge">
                    {profile.relationship === 'Friends'
                      ? 'Friends'
                      : profile.relationship === 'OutgoingRequest'
                        ? 'Request sent'
                        : 'Wants to be friends'}
                  </span>
                  {profile.relationship === 'IncomingRequest' && (
                    <Link className="button secondary" to="/friends">
                      Open friends
                    </Link>
                  )}
                </>
              )}
            </div>
          </section>
        ) : (
          <section className="card public-profile-card">
            <p className="error">{error || 'Profile was not found'}</p>
            <Link className="back-link" to="/rooms">
              Back to rooms
            </Link>
          </section>
        )}
      </main>
    </>
  );
}
