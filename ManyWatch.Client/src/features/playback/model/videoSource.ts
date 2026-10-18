export type VideoProvider = 'youtube' | 'direct';

export type VideoSource =
  | { provider: 'youtube'; url: string; videoId: string }
  | { provider: 'direct'; url: string };

const YOUTUBE_VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

/**
 * Recognizes links that can be embedded into a synchronized player.
 * Supported providers: YouTube (via the IFrame Player API) and direct video
 * files/streams (mp4, webm, ...) played with a native <video> element.
 */
export function parseVideoUrl(raw: string): VideoSource | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return null;
  }

  const host = url.hostname.toLowerCase().replace(/^www\./, '');
  const videoId = extractYouTubeVideoId(host, url);

  if (videoId) {
    return { provider: 'youtube', url: url.toString(), videoId };
  }

  return { provider: 'direct', url: url.toString() };
}

export function getProviderLabel(source: VideoSource): string {
  return source.provider === 'youtube' ? 'YouTube' : 'Direct video';
}

function extractYouTubeVideoId(host: string, url: URL): string | null {
  const segments = url.pathname.split('/').filter(Boolean);

  let candidate: string | null = null;

  if (host === 'youtu.be') {
    candidate = segments[0] ?? null;
  } else if (host === 'youtube.com' || host === 'youtube-nocookie.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
    if (url.searchParams.has('v')) {
      candidate = url.searchParams.get('v');
    } else if (segments[0] === 'embed' || segments[0] === 'shorts' || segments[0] === 'live') {
      candidate = segments[1] ?? null;
    }
  }

  return candidate !== null && YOUTUBE_VIDEO_ID_PATTERN.test(candidate) ? candidate : null;
}
