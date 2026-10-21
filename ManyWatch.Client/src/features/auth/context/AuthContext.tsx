import { useCallback, useEffect, useState, type ReactNode } from 'react';
import {
  getRefreshToken,
  refreshSession,
  setAccessToken,
  setOnSessionExpired,
  setRefreshToken,
} from '../../../shared/httpClient';
import * as authApi from '../api/authApi';
import type { AuthResponse, AuthUser } from '../model/types';
import { AuthContext, type AuthUserPatch } from './authContextInstance';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  function applySession(response: AuthResponse) {
    setAccessToken(response.accessToken);
    setRefreshToken(response.refreshToken);
    setUser({
      id: response.userId,
      email: response.email,
      displayName: response.displayName,
      avatarUrl: response.avatarUrl ?? null,
    });
  }

  function clearSession() {
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
  }

  useEffect(() => {
    setOnSessionExpired(clearSession);

    const storedRefreshToken = getRefreshToken();

    if (!storedRefreshToken) {
      setIsLoading(false);
      return () => setOnSessionExpired(null);
    }

    refreshSession()
      .then((sessionUser) => {
        if (sessionUser) {
          setUser(sessionUser);
        }
      })
      .finally(() => setIsLoading(false));

    return () => setOnSessionExpired(null);
  }, []);

  async function login(email: string, password: string) {
    applySession(await authApi.login({ email, password }));
  }

  async function register(email: string, password: string, displayName: string) {
    applySession(await authApi.register({ email, password, displayName }));
  }

  async function logout() {
    const storedRefreshToken = getRefreshToken();
    clearSession();

    if (storedRefreshToken) {
      await authApi.logout(storedRefreshToken).catch(() => {});
    }
  }

  const updateUser = useCallback((patch: AuthUserPatch) => {
    setUser((current) => (current ? { ...current, ...patch } : current));
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}
