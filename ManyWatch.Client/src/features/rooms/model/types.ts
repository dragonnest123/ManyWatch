export type RoomMember = {
  userId: string;
  joinedAt: string;
  isHost: boolean;
};

export type Room = {
  id: string;
  hostId: string;
  name: string;
  isPrivate: boolean;
  createdAt: string;
  members: RoomMember[];
};

export type CreateRoomRequest = {
  hostId: string;
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
