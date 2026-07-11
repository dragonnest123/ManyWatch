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
