import { apiRequest } from '../../../shared/httpClient';
import type {
  CreateRoomRequest,
  PagedResult,
  PageInfo,
  Room,
  RoomListItem,
  RoomsFilter,
  UpdateRoomSettingsRequest,
} from '../model/types';

export function createRoom(request: CreateRoomRequest): Promise<Room> {
  return apiRequest<Room>('/rooms/create', {
    method: 'POST',
    body: request,
  });
}

export function getRooms(
  filter: RoomsFilter,
  pageInfo: PageInfo,
): Promise<PagedResult<RoomListItem>> {
  const params = new URLSearchParams();

  if (filter.name) {
    params.set('name', filter.name);
  }

  if (filter.isPrivate !== undefined) {
    params.set('isPrivate', String(filter.isPrivate));
  }

  params.set('pageNumber', String(pageInfo.pageNumber));
  params.set('pageSize', String(pageInfo.pageSize));

  return apiRequest<PagedResult<RoomListItem>>(`/rooms?${params.toString()}`);
}

export function getRoom(roomId: string): Promise<Room> {
  return apiRequest<Room>(`/rooms/${roomId}`);
}

export function joinRoom(roomId: string): Promise<Room> {
  return apiRequest<Room>(`/rooms/${roomId}/join`, {
    method: 'POST',
  });
}

export function updateRoomSettings(
  roomId: string,
  request: UpdateRoomSettingsRequest,
): Promise<Room> {
  return apiRequest<Room>(`/rooms/${roomId}/settings`, {
    method: 'PUT',
    body: request,
  });
}

export function renameRoom(roomId: string, name: string): Promise<Room> {
  return apiRequest<Room>(`/rooms/${roomId}/name`, {
    method: 'PUT',
    body: { name },
  });
}

export function leaveRoom(roomId: string): Promise<void> {
  return apiRequest<void>(`/rooms/${roomId}/leave`, {
    method: 'POST',
  });
}

export function heartbeatRoom(roomId: string): Promise<void> {
  return apiRequest<void>(`/rooms/${roomId}/heartbeat`, {
    method: 'POST',
  });
}

export function banMember(roomId: string, userId: string): Promise<void> {
  return apiRequest<void>(`/rooms/${roomId}/members/${userId}/ban`, {
    method: 'POST',
  });
}

export function unbanMember(roomId: string, userId: string): Promise<void> {
  return apiRequest<void>(`/rooms/${roomId}/members/${userId}/ban`, {
    method: 'DELETE',
  });
}

export function deleteRoom(roomId: string): Promise<void> {
  return apiRequest<void>(`/rooms/${roomId}`, {
    method: 'DELETE',
  });
}
