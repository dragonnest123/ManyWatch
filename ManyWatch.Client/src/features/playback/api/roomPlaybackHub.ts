import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { API_BASE_URL } from '../../../shared/httpClient';

export function createRoomHubConnection(): HubConnection {
  return new HubConnectionBuilder()
    .withUrl(`${API_BASE_URL}/hubs/rooms`, { withCredentials: true })
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Warning)
    .build();
}
