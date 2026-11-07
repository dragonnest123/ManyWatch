import { describe, expect, it } from 'vitest';
import { isValidUsername, normalizeUsername } from './username';

describe('username', () => {
  it('normalizes whitespace and casing', () => {
    expect(normalizeUsername('  Alice_01  ')).toBe('alice_01');
  });

  it('accepts supported usernames', () => {
    expect(isValidUsername('alice')).toBe(true);
    expect(isValidUsername('a_b')).toBe(true);
    expect(isValidUsername('user123')).toBe(true);
    expect(isValidUsername('Alice_01')).toBe(true);
    expect(isValidUsername('a'.repeat(32))).toBe(true);
  });

  it('rejects unsupported usernames', () => {
    expect(isValidUsername('ab')).toBe(false);
    expect(isValidUsername('1alice')).toBe(false);
    expect(isValidUsername('_alice')).toBe(false);
    expect(isValidUsername('alice!')).toBe(false);
    expect(isValidUsername('alice b')).toBe(false);
    expect(isValidUsername('a'.repeat(33))).toBe(false);
  });
});
