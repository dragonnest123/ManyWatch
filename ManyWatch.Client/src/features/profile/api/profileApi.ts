import { apiRequest } from '../../../shared/httpClient';
import type {
  AvatarResponse,
  UpdateProfileRequest,
  UserProfile,
  WatchTimeResponse,
} from '../model/types';

export function getProfile(): Promise<UserProfile> {
  return apiRequest<UserProfile>('/profile');
}

export function updateProfile(request: UpdateProfileRequest): Promise<UserProfile> {
  return apiRequest<UserProfile>('/profile', {
    method: 'PUT',
    body: request,
  });
}

export function uploadAvatar(dataUrl: string): Promise<AvatarResponse> {
  return apiRequest<AvatarResponse>('/profile/avatar', {
    method: 'PUT',
    body: { dataUrl },
  });
}

export function deleteAvatar(): Promise<void> {
  return apiRequest<void>('/profile/avatar', {
    method: 'DELETE',
  });
}

export function recordWatchTime(seconds: number): Promise<WatchTimeResponse> {
  return apiRequest<WatchTimeResponse>('/profile/watch-time', {
    method: 'POST',
    body: { seconds },
  });
}
