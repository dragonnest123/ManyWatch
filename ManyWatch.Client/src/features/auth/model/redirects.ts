const ROOMS_PATH_PREFIX = '/rooms/';

export function getRoomRedirect(searchParams: URLSearchParams): string | null {
  const redirect = searchParams.get('redirect');

  return redirect?.startsWith(ROOMS_PATH_PREFIX) ? redirect : null;
}

export function buildAuthPath(path: string, redirect: string | null): string {
  return redirect ? `${path}?redirect=${encodeURIComponent(redirect)}` : path;
}
