import type { ChatMessageDto } from './types';

export const MAX_CHAT_MESSAGE_LENGTH = 500;
export const MAX_VISIBLE_CHAT_MESSAGES = 200;

export function mergeChatMessages(
  current: ChatMessageDto[],
  incoming: ChatMessageDto[],
  limit = MAX_VISIBLE_CHAT_MESSAGES,
): ChatMessageDto[] {
  const byId = new Map<string, ChatMessageDto>();

  for (const message of current) {
    byId.set(message.id, message);
  }

  for (const message of incoming) {
    byId.set(message.id, message);
  }

  return [...byId.values()]
    .sort((left, right) => {
      const timeDifference =
        new Date(left.sentAtUtc).getTime() - new Date(right.sentAtUtc).getTime();

      if (timeDifference !== 0) {
        return timeDifference;
      }

      return left.id.localeCompare(right.id);
    })
    .slice(-limit);
}
