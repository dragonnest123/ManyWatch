import type { FriendRelationship } from '../../friends/model/types';

export type UserProfile = {
  userId: string;
  email: string;
  username: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: string;
  watchedSeconds: number;
  friendCount: number;
};

export type PublicProfile = {
  userId: string;
  username: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: string;
  friendCount: number;
  relationship: FriendRelationship;
  isSelf: boolean;
};

export type UpdateProfileRequest = {
  username: string;
  displayName: string;
  bio: string | null;
};

export type AvatarResponse = {
  avatarUrl: string;
};

export type WatchTimeResponse = {
  watchedSeconds: number;
};
