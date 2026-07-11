import { apiRequest } from '../../../shared/httpClient';
import type { CreateRoomRequest, Room } from '../model/types';

export function createRoom(request: CreateRoomRequest): Promise<Room> {
  return apiRequest<Room>('/rooms', {
    method: 'POST',
    body: request,
  });
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