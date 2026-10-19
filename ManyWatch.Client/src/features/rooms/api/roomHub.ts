import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { API_BASE_URL } from '../../../shared/httpClient';

export const ROOM_PLAYBACK_HUB_PATH = '/hubs/rooms/playback';
export const ROOM_CHAT_HUB_PATH = '/hubs/rooms/chat';

export function createRoomHubConnection(hubPath: string): HubConnection {
  return new HubConnectionBuilder()
    .withUrl(`${API_BASE_URL}${hubPath}`, { withCredentials: true })
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Warning)
    .build();
}
