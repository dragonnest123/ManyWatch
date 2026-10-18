import type { PlaybackStateDto } from '../../playback/model/types';

export type RoomJoinPolicy = 'Everyone' | 'AuthorizedOnly';

export type RoomMember = {
  userId: string;
  joinedAt: string;
  isHost: boolean;
  isMe: boolean;
};

export type BannedMember = {
  userId: string;
  bannedAt: string;
};

export type Room = {
  id: string;
  name: string;
  isPrivate: boolean;
  maxMembers: number | null;
  joinPolicy: RoomJoinPolicy;
  members: RoomMember[];
  bans: BannedMember[];
  playback: PlaybackStateDto | null;
};

export type CreateRoomRequest = {
  name: string;
  isPrivate: boolean;
};

export type UpdateRoomSettingsRequest = {
  isPrivate: boolean;
  maxMembers: number | null;
  joinPolicy: RoomJoinPolicy;
};

export type RoomListItem = {
  id: string;
  name: string;
  isPrivate: boolean;
  memberCount: number;
  maxMembers: number | null;
  joinPolicy: RoomJoinPolicy;
};

export type RoomsFilter = {
  name?: string;
  isPrivate?: boolean;
};

export type PageInfo = {
  pageNumber: number;
  pageSize: number;
};

export type PagedResult<T> = {
  items: T[];
  totalItemsCount: number;
  pageInfo: PageInfo;
};
