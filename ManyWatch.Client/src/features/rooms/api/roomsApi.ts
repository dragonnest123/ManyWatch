import { apiRequest } from '../../../shared/httpClient';
import type {
  CreateRoomRequest,
  DeleteRoomRequest,
  JoinRoomRequest,
  LeaveRoomRequest,
  Room,
} from '../model/types';

export function createRoom(request: CreateRoomRequest): Promise<Room> {
  return apiRequest<Room>('/rooms', {
    method: 'POST',
    body: request,
  });
}

export function getRoom(roomId: string): Promise<Room> {
  return apiRequest<Room>(`/rooms/${roomId}`);
}

export function joinRoom(roomId: string, request: JoinRoomRequest): Promise<Room> {
  return apiRequest<Room>(`/rooms/${roomId}/join`, {
    method: 'POST',
    body: request,
  });
}

export function leaveRoom(roomId: string, request: LeaveRoomRequest): Promise<Room | { message: string }> {
  return apiRequest<Room | { message: string }>(`/rooms/${roomId}/leave`, {
    method: 'POST',
    body: request,
  });
}

export function deleteRoom(roomId: string, request: DeleteRoomRequest): Promise<void> {
  return apiRequest<void>(`/rooms/${roomId}`, {
    method: 'DELETE',
    body: request,
  });
}
