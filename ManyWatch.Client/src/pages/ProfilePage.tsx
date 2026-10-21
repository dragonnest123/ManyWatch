import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../features/auth/hooks/useAuth';
import { buildAuthPath } from '../features/auth/model/redirects';
import { deleteAvatar, getProfile, updateProfile, uploadAvatar } from '../features/profile/api/profileApi';
import { createAvatarDataUrl } from '../features/profile/model/avatarImage';
import { formatWatchedHours } from '../features/profile/model/format';
import type { UserProfile } from '../features/profile/model/types';
import { AppHeader } from '../shared/AppHeader';
import { UserAvatar } from '../shared/UserAvatar';

const BIO_LIMIT = 500;

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});

export function ProfilePage() {
  const { user, isLoading: isAuthLoading, updateUser } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAvatarBusy, setIsAvatarBusy] = useState(false);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const userId = user?.id ?? null;

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      return;
    }

    let isCancelled = false;
    setIsLoading(true);
    setError('');

    getProfile()
      .then((loadedProfile) => {
        if (isCancelled) {
          return;
        }

        setProfile(loadedProfile);
        setDisplayName(loadedProfile.displayName);
        setBio(loadedProfile.bio ?? '');
        updateUser({
          displayName: loadedProfile.displayName,
          avatarUrl: loadedProfile.avatarUrl,
        });
      })
      .catch((error: unknown) => {
        if (!isCancelled) {
          setError(error instanceof Error ? error.message : 'Failed to load profile');
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
  }, [userId, updateUser]);

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
            Back
          </Link>

          <section className="card form-card">
            <p className="eyebrow">Account</p>
            <h1>Your profile</h1>
            <p className="card-lead">
              Profile details, watch time and friends are available after signing in
            </p>

            <div className="actions">
              <Link className="button" to={buildAuthPath('/login', '/profile')}>
                Log in
              </Link>
              <Link className="button secondary" to={buildAuthPath('/register', '/profile')}>
                Sign up
              </Link>
            </div>
          </section>
        </main>
      </>
    );
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError('');
    setStatusMessage('');

    try {
      const updatedProfile = await updateProfile({
        displayName: displayName.trim(),
        bio: bio.trim() || null,
      });

      setProfile(updatedProfile);
      setDisplayName(updatedProfile.displayName);
      setBio(updatedProfile.bio ?? '');
      updateUser({
        displayName: updatedProfile.displayName,
        avatarUrl: updatedProfile.avatarUrl,
      });
      setStatusMessage('Profile saved');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Profile could not be saved');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAvatarSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    setIsAvatarBusy(true);
    setError('');
    setStatusMessage('');

    try {
      const dataUrl = await createAvatarDataUrl(file);
      const response = await uploadAvatar(dataUrl);

      setProfile((current) => (current ? { ...current, avatarUrl: response.avatarUrl } : current));
      updateUser({ avatarUrl: response.avatarUrl });
      setStatusMessage('Avatar updated');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Avatar could not be updated');
    } finally {
      setIsAvatarBusy(false);
    }
  }

  async function handleRemoveAvatar() {
    setIsAvatarBusy(true);
    setError('');
    setStatusMessage('');

    try {
      await deleteAvatar();

      setProfile((current) => (current ? { ...current, avatarUrl: null } : current));
      updateUser({ avatarUrl: null });
      setStatusMessage('Avatar removed');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Avatar could not be removed');
    } finally {
      setIsAvatarBusy(false);
    }
  }

  return (
    <>
      <AppHeader />

      <main className="page profile-page">
        <Link className="back-link" to="/rooms">
          Rooms
        </Link>

        <div className="profile-heading">
          <div>
            <p className="eyebrow">Account</p>
            <h1>Your profile</h1>
          </div>
          <p className="muted">Personal details, watch time and friends in one place</p>
        </div>

        {error && <p className="error">{error}</p>}
        {statusMessage && (
          <p className="muted" aria-live="polite">
            {statusMessage}
          </p>
        )}

        {isLoading && !profile ? (
          <section className="card">
            <p>Loading profile...</p>
          </section>
        ) : profile ? (
          <section className="profile-layout">
            <aside className="card profile-identity">
              <UserAvatar
                className="profile-avatar"
                displayName={profile.displayName}
                avatarUrl={profile.avatarUrl}
              />

              <div className="avatar-actions">
                <input
                  ref={avatarInputRef}
                  className="avatar-file-input"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={(event) => void handleAvatarSelected(event)}
                  disabled={isAvatarBusy}
                />
                <button
                  type="button"
                  className="compact"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={isAvatarBusy}
                >
                  {isAvatarBusy ? 'Saving...' : 'Change avatar'}
                </button>

                {profile.avatarUrl && (
                  <button
                    type="button"
                    className="secondary compact"
                    onClick={() => void handleRemoveAvatar()}
                    disabled={isAvatarBusy}
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="profile-identity-copy">
                <h2>{profile.displayName}</h2>
                <p className="muted">{profile.email}</p>
              </div>

              <p className={profile.bio ? 'profile-bio' : 'muted'}>
                {profile.bio || 'No bio yet. Tell other viewers a little about yourself'}
              </p>
            </aside>

            <div className="profile-main">
              <section className="profile-stats" aria-label="Profile statistics">
                <article className="card profile-stat">
                  <span className="profile-stat-value">
                    {formatWatchedHours(profile.watchedSeconds)}
                  </span>
                  <span className="profile-stat-label">Hours watched</span>
                </article>

                <article className="card profile-stat">
                  <span className="profile-stat-value">{profile.friendCount}</span>
                  <span className="profile-stat-label">
                    {profile.friendCount === 1 ? 'Friend' : 'Friends'}
                  </span>
                </article>

                <article className="card profile-stat">
                  <span className="profile-stat-value profile-stat-date">
                    {formatDate(profile.createdAt)}
                  </span>
                  <span className="profile-stat-label">Member since</span>
                </article>
              </section>

              <section className="card profile-form-card">
                <h2>About you</h2>

                <form className="form" onSubmit={handleSave}>
                  <label>
                    Display name
                    <input
                      required
                      maxLength={64}
                      value={displayName}
                      onChange={(event) => setDisplayName(event.target.value)}
                      placeholder="How others see you"
                    />
                  </label>

                  <label>
                    Bio
                    <textarea
                      maxLength={BIO_LIMIT}
                      rows={5}
                      value={bio}
                      onChange={(event) => setBio(event.target.value)}
                      placeholder="A few words about you and what you like to watch"
                    />
                  </label>

                  <span className="bio-counter">
                    {bio.length} / {BIO_LIMIT}
                  </span>

                  <div className="actions">
                    <button type="submit" disabled={isSaving || displayName.trim().length === 0}>
                      {isSaving ? 'Saving...' : 'Save changes'}
                    </button>
                  </div>
                </form>

                <p className="muted profile-note">
                  Watch time is counted while you are signed in and a room video is playing
                </p>
              </section>
            </div>
          </section>
        ) : (
          <section className="card">
            <p className="muted">Profile is not available right now</p>
          </section>
        )}
      </main>
    </>
  );
}

function formatDate(value: string): string {
  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? 'Unknown' : dateFormatter.format(date);
}
