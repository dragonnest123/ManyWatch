import { useEffect, useRef, useState, type FormEvent } from 'react';
import { MAX_CHAT_MESSAGE_LENGTH } from '../../chat/model/messages';
import { UserAvatar } from '../../../shared/UserAvatar';
import { useFriendChat } from '../hooks/useFriendChat';
import type { Friend } from '../model/types';

type Props = {
  friend: Friend;
  viewerId: string;
  onRemoveFriend: () => void;
};

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: '2-digit',
  minute: '2-digit',
});

export function FriendChatPanel({ friend, viewerId, onRemoveFriend }: Props) {
  const { messages, status, error, sendMessage } = useFriendChat({
    friendId: friend.userId,
    enabled: true,
  });
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const messagesRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const list = messagesRef.current;
    if (!list || !stickToBottomRef.current) {
      return;
    }

    list.scrollTop = list.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen]);

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

  const isInputDisabled = status !== 'connected';

  return (
    <section className="card chat-card friend-chat-card" aria-label={`Chat with ${friend.displayName}`}>
      <div className="chat-header friend-chat-header">
        <div className="friend-chat-identity">
          <UserAvatar
            className="friend-avatar"
            displayName={friend.displayName}
            avatarUrl={friend.avatarUrl}
          />
          <div>
            <h2 className="friend-chat-name">
              {friend.displayName}
              {friend.isOnline && (
                <span className="friend-online-dot" role="img" aria-label="Online" />
              )}
            </h2>
            <p className="muted">@{friend.username}</p>
          </div>
        </div>

        <div className="friend-chat-actions">
          <div className="friend-menu" ref={menuRef}>
            <button
              type="button"
              className="secondary icon-button"
              aria-label="Friend actions"
              aria-haspopup="menu"
              aria-expanded={isMenuOpen}
              onClick={() => setIsMenuOpen((open) => !open)}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <circle cx="12" cy="5" r="1.7" />
                <circle cx="12" cy="12" r="1.7" />
                <circle cx="12" cy="19" r="1.7" />
              </svg>
            </button>

            {isMenuOpen && (
              <div className="friend-menu-popover" role="menu">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onRemoveFriend();
                  }}
                >
                  Delete friend
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div
        className="chat-messages"
        ref={messagesRef}
        role="log"
        aria-label="Direct messages"
        aria-live="polite"
        onScroll={handleScroll}
      >
        {messages.length === 0 ? (
          <p className="muted chat-empty">
            {status === 'connected' ? 'No messages yet. Say hello' : 'Loading chat...'}
          </p>
        ) : (
          messages.map((message) => {
            const isMe = message.senderId === viewerId;

            return (
              <article key={message.id} className={`chat-message${isMe ? ' is-me' : ''}`}>
                <div className="chat-message-meta">
                  <span className="chat-message-author">
                    {isMe ? 'You' : friend.displayName}
                  </span>
                  <time dateTime={message.sentAtUtc}>{formatTime(message.sentAtUtc)}</time>
                </div>
                <p className="chat-message-text">{message.content}</p>
              </article>
            );
          })
        )}
      </div>

      {error && <p className="error chat-error">{error}</p>}

      <form className="chat-form" onSubmit={handleSubmit}>
        <input
          type="text"
          value={draft}
          maxLength={MAX_CHAT_MESSAGE_LENGTH}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={status === 'connected' ? 'Write a message...' : 'Connecting...'}
          disabled={isInputDisabled}
          aria-label="Direct message"
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
