import { describe, expect, it } from 'vitest';
import { mergeChatMessages } from './messages';
import type { ChatMessageDto } from './types';

function message(id: string, sentAtUtc: string, content = id): ChatMessageDto {
  return {
    id,
    userId: 'user-1',
    content,
    sentAtUtc,
  };
}

describe('mergeChatMessages', () => {
  it('orders history and live updates by sent time', () => {
    const merged = mergeChatMessages(
      [message('second', '2026-01-01T00:00:02Z')],
      [message('first', '2026-01-01T00:00:01Z'), message('third', '2026-01-01T00:00:03Z')],
    );

    expect(merged.map((item) => item.id)).toEqual(['first', 'second', 'third']);
  });

  it('deduplicates messages that arrive both in history and as live updates', () => {
    const original = message('same', '2026-01-01T00:00:01Z', 'hello');
    const repeated = { ...original, content: 'hello again' };

    const merged = mergeChatMessages([original], [repeated]);

    expect(merged).toHaveLength(1);
    expect(merged[0].content).toBe('hello again');
  });

  it('keeps only the newest messages up to the limit', () => {
    const messages = [
      message('first', '2026-01-01T00:00:01Z'),
      message('second', '2026-01-01T00:00:02Z'),
      message('third', '2026-01-01T00:00:03Z'),
    ];

    const merged = mergeChatMessages([], messages, 2);

    expect(merged.map((item) => item.id)).toEqual(['second', 'third']);
  });
});
