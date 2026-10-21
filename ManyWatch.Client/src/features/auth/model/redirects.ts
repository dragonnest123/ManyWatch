const ROOMS_PATH_PREFIX = '/rooms/';
const FRIENDS_PATH = '/friends';
const PROFILE_PATH = '/profile';

export function getAuthRedirect(searchParams: URLSearchParams): string | null {
  const redirect = searchParams.get('redirect');

  if (!redirect || !redirect.startsWith('/') || redirect.startsWith('//')) {
    return null;
  }

  return redirect.startsWith(ROOMS_PATH_PREFIX)
    || redirect === FRIENDS_PATH
    || redirect.startsWith(`${FRIENDS_PATH}/`)
    || redirect === PROFILE_PATH
    ? redirect
    : null;
}

export function buildAuthPath(path: string, redirect: string | null): string {
  return redirect ? `${path}?redirect=${encodeURIComponent(redirect)}` : path;
}
