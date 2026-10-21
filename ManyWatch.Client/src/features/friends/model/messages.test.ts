import { describe, expect, it } from 'vitest';
import { mergeChatMessages } from '../../chat/model/messages';
import type { DirectMessage } from './types';

function message(id: string, sentAtUtc: string, content = id): DirectMessage {
  return {
    id,
    senderId: 'sender',
    recipientId: 'recipient',
    content,
    sentAtUtc,
  };
}

describe('mergeChatMessages for direct messages', () => {
  it('deduplicates by id and keeps chronological order', () => {
    const first = message('b', '2026-01-01T10:00:02Z', 'second');
    const second = message('a', '2026-01-01T10:00:01Z', 'first');

    const merged = mergeChatMessages([second], [first, second]);

    expect(merged.map((item) => item.id)).toEqual(['a', 'b']);
  });

  it('keeps only the most recent messages when the limit is exceeded', () => {
    const messages = [
      message('a', '2026-01-01T10:00:01Z'),
      message('b', '2026-01-01T10:00:02Z'),
      message('c', '2026-01-01T10:00:03Z'),
    ];

    const merged = mergeChatMessages([], messages, 2);

    expect(merged.map((item) => item.id)).toEqual(['b', 'c']);
  });
});
