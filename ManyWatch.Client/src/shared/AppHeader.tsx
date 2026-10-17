import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import * as authApi from '../features/auth/api/authApi';
import { useAuth } from '../features/auth/hooks/useAuth';
import type { MeResponse } from '../features/auth/model/types';
import { useCurrentRoom } from '../features/rooms/hooks/useCurrentRoom';

export function AppHeader() {
  const { user, logout } = useAuth();
  const { clearCurrentRoom } = useCurrentRoom();
  const navigate = useNavigate();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [profile, setProfile] = useState<MeResponse | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  async function handleToggleMenu() {
    const nextIsOpen = !isMenuOpen;
    setIsMenuOpen(nextIsOpen);

    if (nextIsOpen) {
      setProfileError('');
      setIsLoadingProfile(true);

      try {
        setProfile(await authApi.me());
      } catch (error) {
        setProfileError(error instanceof Error ? error.message : 'Failed to load profile');
      } finally {
        setIsLoadingProfile(false);
      }
    }
  }

  async function handleLogout() {
    setIsMenuOpen(false);
    await logout();
    clearCurrentRoom();
    navigate('/');
  }

  return (
    <header className="app-header">
      <Link className="brand" to="/">
        ManyWatch
      </Link>

      <div className="header-right">
        <nav className="top-nav" aria-label="Main navigation">
          <NavLink end to="/rooms">
            Rooms
          </NavLink>
        </nav>

        {user ? (
          <div className="user-menu" ref={menuRef}>
            <button
              className="secondary current-user"
              type="button"
              onClick={handleToggleMenu}
              aria-expanded={isMenuOpen}
            >
              {user.displayName}
            </button>

            {isMenuOpen && (
              <div className="user-popover">
                {isLoadingProfile && <p className="muted">Loading...</p>}
                {profileError && <p className="error">{profileError}</p>}
                {profile && !isLoadingProfile && !profileError && (
                  <dl className="profile-details">
                    <dt>Email</dt>
                    <dd title={profile.email}>{profile.email}</dd>
                    <dt>Member since</dt>
                    <dd>{new Date(profile.createdAt).toLocaleDateString()}</dd>
                  </dl>
                )}

                <button className="danger" type="button" onClick={handleLogout}>
                  Log out
                </button>
              </div>
            )}
          </div>
        ) : (
          <nav className="top-nav" aria-label="Account">
            <NavLink to="/login">Log in</NavLink>
            <NavLink to="/register">Sign up</NavLink>
          </nav>
        )}
      </div>
    </header>
  );
}
