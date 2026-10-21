const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

/**
 * Keeps guest cookies same-site when the app is opened through a different
 * loopback host than the API. Without this, localhost and 127.0.0.1 are
 * different sites and every API request receives a new anonymous identity.
 */
export function resolveApiBaseUrl(configured: string, pageHost: string | null): string {
  if (!pageHost || !LOOPBACK_HOSTS.has(pageHost)) {
    return configured;
  }

  try {
    const url = new URL(configured);

    if (!LOOPBACK_HOSTS.has(url.hostname) || url.hostname === pageHost) {
      return configured;
    }

    url.hostname = pageHost;

    const resolved = url.toString();
    return resolved.endsWith('/') ? resolved.slice(0, -1) : resolved;
  } catch {
    return configured;
  }
}
