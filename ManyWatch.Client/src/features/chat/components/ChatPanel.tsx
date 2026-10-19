import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { RoomConnectionStatus } from '../../playback/model/types';
import { getViewerName } from '../../rooms/model/viewerName';
import { useRoomChat } from '../hooks/useRoomChat';
import { MAX_CHAT_MESSAGE_LENGTH } from '../model/messages';

type Props = {
  roomId: string;
  viewerId: string | null;
  enabled: boolean;
};

const STATUS_LABELS: Record<RoomConnectionStatus, string> = {
  connecting: 'Connecting...',
  connected: 'Live',
  reconnecting: 'Reconnecting...',
  disconnected: 'Offline',
};

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: '2-digit',
  minute: '2-digit',
});

export function ChatPanel({ roomId, viewerId, enabled }: Props) {
  const { messages, status, error, sendMessage } = useRoomChat({ roomId, enabled });
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);

  const messagesRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);

  useEffect(() => {
    const list = messagesRef.current;
    if (!list || !stickToBottomRef.current) {
      return;
    }

    list.scrollTop = list.scrollHeight;
  }, [messages]);

  function handleScroll() {
    const list = messagesRef.current;
    if (!list) {
      return;
    }

    stickToBottomRef.current =
      list.scrollHeight - list.scrollTop - list.clientHeight < 40;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const content = draft.trim();
    if (!content || isSending || status !== 'connected') {
      return;
    }

    setIsSending(true);

    try {
      await sendMessage(content);
      setDraft('');
    } catch {
      // The hook exposes a user-facing send error.
    } finally {
      setIsSending(false);
    }
  }

  const isInputDisabled = !enabled || status !== 'connected';

  return (
    <section className="card chat-card" aria-label="Room chat">
      <div className="chat-header">
        <h2>Chat</h2>
        {enabled && status !== 'connected' && (
          <span className="muted chat-status">{STATUS_LABELS[status]}</span>
        )}
      </div>

      <div
        className="chat-messages"
        ref={messagesRef}
        role="log"
        aria-label="Chat messages"
        aria-live="polite"
        onScroll={handleScroll}
      >
        {!enabled ? (
          <p className="muted chat-empty">Join the room to chat with other viewers</p>
        ) : messages.length === 0 ? (
          <p className="muted chat-empty">
            {status === 'connected' ? 'No messages yet. Say hello' : 'Loading chat...'}
          </p>
        ) : (
          messages.map((message) => {
            const isMe = message.userId === viewerId;

            return (
              <article key={message.id} className={`chat-message${isMe ? ' is-me' : ''}`}>
                <div className="chat-message-meta">
                  <span className="chat-message-author">
                    {getViewerName(message.userId, isMe)}
                  </span>
                  <time dateTime={message.sentAtUtc}>{formatTime(message.sentAtUtc)}</time>
                </div>
                <p className="chat-message-text">{message.content}</p>
              </article>
            );
          })
        )}
      </div>

      {enabled && error && <p className="error chat-error">{error}</p>}

      <form className="chat-form" onSubmit={handleSubmit}>
        <input
          type="text"
          value={draft}
          maxLength={MAX_CHAT_MESSAGE_LENGTH}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={
            !enabled
              ? 'Join the room to chat'
              : status === 'connected'
                ? 'Write a message...'
                : 'Connecting...'
          }
          disabled={isInputDisabled}
          aria-label="Chat message"
        />
        <button
          type="submit"
          disabled={isInputDisabled || isSending || draft.trim().length === 0}
        >
          {isSending ? 'Sending...' : 'Send'}
        </button>
      </form>
    </section>
  );
}

function formatTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : timeFormatter.format(date);
}
