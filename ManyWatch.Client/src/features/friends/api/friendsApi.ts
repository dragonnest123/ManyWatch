import { apiRequest } from '../../../shared/httpClient';
import type {
  AcceptedRoomInvitation,
  Friend,
  FriendRequests,
  RoomInvitation,
  UserSearchResult,
} from '../model/types';

export function getFriends(): Promise<Friend[]> {
  return apiRequest<Friend[]>('/friends');
}

export function getFriendRequests(): Promise<FriendRequests> {
  return apiRequest<FriendRequests>('/friends/requests');
}

export function searchUsers(query: string): Promise<UserSearchResult[]> {
  return apiRequest<UserSearchResult[]>(`/friends/search?query=${encodeURIComponent(query)}`);
}

export function sendFriendRequest(userId: string): Promise<void> {
  return apiRequest<void>('/friends/requests', {
    method: 'POST',
    body: { userId },
  });
}

export function acceptFriendRequest(requestId: string): Promise<void> {
  return apiRequest<void>(`/friends/requests/${requestId}/accept`, {
    method: 'POST',
  });
}

export function deleteFriendRequest(requestId: string): Promise<void> {
  return apiRequest<void>(`/friends/requests/${requestId}`, {
    method: 'DELETE',
  });
}

export function removeFriend(friendId: string): Promise<void> {
  return apiRequest<void>(`/friends/${friendId}`, {
    method: 'DELETE',
  });
}

export function getRoomInvitations(): Promise<RoomInvitation[]> {
  return apiRequest<RoomInvitation[]>('/friends/invitations');
}

export function sendRoomInvitation(friendId: string, roomId: string): Promise<RoomInvitation> {
  return apiRequest<RoomInvitation>('/friends/invitations', {
    method: 'POST',
    body: { friendId, roomId },
  });
}

export function acceptRoomInvitation(invitationId: string): Promise<AcceptedRoomInvitation> {
  return apiRequest<AcceptedRoomInvitation>(`/friends/invitations/${invitationId}/accept`, {
    method: 'POST',
  });
}

export function deleteRoomInvitation(invitationId: string): Promise<void> {
  return apiRequest<void>(`/friends/invitations/${invitationId}`, {
    method: 'DELETE',
  });
}
