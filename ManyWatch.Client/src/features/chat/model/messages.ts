export const MAX_CHAT_MESSAGE_LENGTH = 500;
export const MAX_VISIBLE_CHAT_MESSAGES = 200;

type TimedMessage = {
  id: string;
  sentAtUtc: string;
};

export function mergeChatMessages<TMessage extends TimedMessage>(
  current: TMessage[],
  incoming: TMessage[],
  limit = MAX_VISIBLE_CHAT_MESSAGES,
): TMessage[] {
  const byId = new Map<string, TMessage>();

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
