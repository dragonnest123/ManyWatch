import { API_BASE_URL } from './httpClient';

export function resolveAvatarUrl(avatarUrl: string): string {
  if (/^(https?:|data:|blob:)/i.test(avatarUrl)) {
    return avatarUrl;
  }

  return `${API_BASE_URL}${avatarUrl.startsWith('/') ? '' : '/'}${avatarUrl}`;
}
