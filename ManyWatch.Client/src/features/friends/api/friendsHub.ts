import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { API_BASE_URL, getAccessToken } from '../../../shared/httpClient';

export const FRIENDS_HUB_PATH = '/hubs/friends';

export function createFriendsHubConnection(): HubConnection {
  return new HubConnectionBuilder()
    .withUrl(`${API_BASE_URL}${FRIENDS_HUB_PATH}`, {
      withCredentials: true,
      accessTokenFactory: () => getAccessToken() ?? '',
    })
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Warning)
    .build();
}
