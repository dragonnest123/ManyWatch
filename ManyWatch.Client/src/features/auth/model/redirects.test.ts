import { describe, expect, it } from 'vitest';
import { buildAuthPath, getAuthRedirect } from './redirects';

describe('getAuthRedirect', () => {
  it('allows room and friends redirects', () => {
    expect(getAuthRedirect(new URLSearchParams('redirect=%2Frooms%2Fabc'))).toBe('/rooms/abc');
    expect(getAuthRedirect(new URLSearchParams('redirect=%2Ffriends'))).toBe('/friends');
  });

  it('rejects external and unrelated redirects', () => {
    expect(getAuthRedirect(new URLSearchParams('redirect=https%3A%2F%2Fevil.example'))).toBeNull();
    expect(getAuthRedirect(new URLSearchParams('redirect=%2F%2Fevil.example'))).toBeNull();
    expect(getAuthRedirect(new URLSearchParams('redirect=%2Fhelp'))).toBeNull();
  });

  it('builds auth paths with an encoded redirect', () => {
    expect(buildAuthPath('/login', '/friends')).toBe('/login?redirect=%2Ffriends');
    expect(buildAuthPath('/login', null)).toBe('/login');
  });
});
