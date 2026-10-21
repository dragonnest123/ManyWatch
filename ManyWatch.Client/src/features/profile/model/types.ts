export type UserProfile = {
  userId: string;
  email: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: string;
  watchedSeconds: number;
  friendCount: number;
};

export type UpdateProfileRequest = {
  displayName: string;
  bio: string | null;
};

export type AvatarResponse = {
  avatarUrl: string;
};

export type WatchTimeResponse = {
  watchedSeconds: number;
};
