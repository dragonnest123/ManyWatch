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
  members: RoomMember[];
  bans: BannedMember[];
};

export type CreateRoomRequest = {
  name: string;
  isPrivate: boolean;
};

export type RoomListItem = {
  id: string;
  name: string;
  isPrivate: boolean;
  memberCount: number;
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
