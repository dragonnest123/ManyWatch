import { describe, expect, it } from 'vitest';
import { resolveApiBaseUrl } from './apiBaseUrl';

describe('resolveApiBaseUrl', () => {
  it('follows the loopback host used by the page', () => {
    expect(resolveApiBaseUrl('http://localhost:5215', '127.0.0.1')).toBe(
      'http://127.0.0.1:5215',
    );
    expect(resolveApiBaseUrl('http://127.0.0.1:5215', 'localhost')).toBe(
      'http://localhost:5215',
    );
    expect(resolveApiBaseUrl('http://localhost:5215', '[::1]')).toBe(
      'http://[::1]:5215',
    );
  });

  it('keeps the configured host when it already matches', () => {
    expect(resolveApiBaseUrl('http://localhost:5215', 'localhost')).toBe(
      'http://localhost:5215',
    );
  });

  it('does not rewrite external hosts or non-loopback pages', () => {
    expect(resolveApiBaseUrl('https://api.example.com', 'localhost')).toBe(
      'https://api.example.com',
    );
    expect(resolveApiBaseUrl('http://localhost:5215', 'manywatch.example')).toBe(
      'http://localhost:5215',
    );
  });

  it('handles relative and invalid values', () => {
    expect(resolveApiBaseUrl('/api', '127.0.0.1')).toBe('/api');
    expect(resolveApiBaseUrl('not a url', '127.0.0.1')).toBe('not a url');
    expect(resolveApiBaseUrl('http://localhost:5215', null)).toBe(
      'http://localhost:5215',
    );
  });
});
