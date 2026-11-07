export type Friend = {
  userId: string;
  username: string;
  displayName: string;
  friendsSince: string;
  avatarUrl: string | null;
  isOnline: boolean;
};

export type FriendRequest = {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  createdAt: string;
  avatarUrl: string | null;
};

export type FriendRequests = {
  incoming: FriendRequest[];
  outgoing: FriendRequest[];
};

export type FriendRelationship = 'None' | 'Friends' | 'OutgoingRequest' | 'IncomingRequest';

export type UserSearchResult = {
  userId: string;
  username: string;
  displayName: string;
  relationship: FriendRelationship;
  avatarUrl: string | null;
};

export type RoomInvitation = {
  id: string;
  roomId: string;
  roomName: string;
  senderId: string;
  senderDisplayName: string;
  createdAt: string;
};

export type AcceptedRoomInvitation = {
  roomId: string;
};

export type DirectMessage = {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  sentAtUtc: string;
};
