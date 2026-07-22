import { apiRequest } from '../../../shared/httpClient';
import type {
  CreateRoomRequest,
  PagedResult,
  PageInfo,
  Room,
  RoomListItem,
  RoomsFilter,
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

export function joinRoom(roomId: string, userId: string): Promise<Room> {
  return apiRequest<Room>(`/rooms/${roomId}/join/${userId}`, {
    method: 'POST',
  });
}

export function leaveRoom(roomId: string, userId: string): Promise<Room | { message: string }> {
  return apiRequest<Room | { message: string }>(`/rooms/${roomId}/leave/${userId}`, {
    method: 'POST',
  });
}

export function deleteRoom(roomId: string, userId: string): Promise<void> {
  return apiRequest<void>(`/rooms/${roomId}/${userId}`, {
    method: 'DELETE',
  });
}