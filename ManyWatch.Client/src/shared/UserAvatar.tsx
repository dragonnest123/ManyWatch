import { useState } from 'react';
import { resolveAvatarUrl } from './avatarUrl';

type Props = {
  displayName: string;
  avatarUrl?: string | null;
  className?: string;
};

export function UserAvatar({ displayName, avatarUrl, className }: Props) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const classes = className ? `avatar ${className}` : 'avatar';
  const showImage = Boolean(avatarUrl) && avatarUrl !== failedUrl;

  return (
    <span className={classes} aria-hidden="true">
      {showImage && avatarUrl ? (
        <img
          src={resolveAvatarUrl(avatarUrl)}
          alt=""
          onError={() => setFailedUrl(avatarUrl)}
        />
      ) : (
        getInitial(displayName)
      )}
    </span>
  );
}

function getInitial(displayName: string): string {
  return displayName.trim().charAt(0).toUpperCase() || '?';
}
