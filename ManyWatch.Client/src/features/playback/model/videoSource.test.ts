import { describe, expect, it } from 'vitest';
import { getProviderLabel, parseVideoUrl } from './videoSource';

const VIDEO_ID = 'aqz-KE-bpKQ';

describe('parseVideoUrl', () => {
  it.each([
    [`https://youtu.be/${VIDEO_ID}`, `https://youtu.be/${VIDEO_ID}`],
    [`https://www.youtube.com/watch?v=${VIDEO_ID}&t=30s`, `https://www.youtube.com/watch?v=${VIDEO_ID}&t=30s`],
    [`https://m.youtube.com/watch?v=${VIDEO_ID}`, `https://m.youtube.com/watch?v=${VIDEO_ID}`],
    [`https://music.youtube.com/watch?v=${VIDEO_ID}`, `https://music.youtube.com/watch?v=${VIDEO_ID}`],
    [`https://youtube.com/shorts/${VIDEO_ID}`, `https://youtube.com/shorts/${VIDEO_ID}`],
    [`https://www.youtube.com/embed/${VIDEO_ID}`, `https://www.youtube.com/embed/${VIDEO_ID}`],
    [`https://www.youtube-nocookie.com/embed/${VIDEO_ID}`, `https://www.youtube-nocookie.com/embed/${VIDEO_ID}`],
    [`https://www.youtube.com/live/${VIDEO_ID}`, `https://www.youtube.com/live/${VIDEO_ID}`],
  ])('recognizes youtube link %s', (input, expectedUrl) => {
    const source = parseVideoUrl(input);

    expect(source).toEqual({ provider: 'youtube', url: expectedUrl, videoId: VIDEO_ID });
  });

  it('normalizes the host and keeps the video id for uppercase links', () => {
    const source = parseVideoUrl(`HTTPS://WWW.YOUTUBE.COM/watch?v=${VIDEO_ID}`);

    expect(source?.provider).toBe('youtube');
    expect(source).toMatchObject({ videoId: VIDEO_ID });
  });

  it('treats youtube links with an invalid video id as direct videos', () => {
    const source = parseVideoUrl('https://youtu.be/short');

    expect(source).toEqual({ provider: 'direct', url: 'https://youtu.be/short' });
  });

  it('treats a youtube watch link without v as a direct video', () => {
    const source = parseVideoUrl('https://www.youtube.com/watch');

    expect(source?.provider).toBe('direct');
  });

  it('recognizes direct video files', () => {
    const url = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

    expect(parseVideoUrl(url)).toEqual({ provider: 'direct', url });
  });

  it('trims surrounding whitespace', () => {
    const source = parseVideoUrl('  https://example.com/movie.webm  ');

    expect(source).toEqual({ provider: 'direct', url: 'https://example.com/movie.webm' });
  });

  it.each([
    '',
    '   ',
    'not a url',
    'ftp://example.com/movie.mp4',
    'javascript:alert(1)',
    'data:text/plain,hello',
    'file:///C:/movies/movie.mp4',
  ])('rejects unsupported input %j', (input) => {
    expect(parseVideoUrl(input)).toBeNull();
  });

  it('labels providers for the UI', () => {
    expect(getProviderLabel({ provider: 'youtube', url: 'x', videoId: VIDEO_ID })).toBe('YouTube');
    expect(getProviderLabel({ provider: 'direct', url: 'x' })).toBe('Direct video');
  });
});
