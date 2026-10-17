import { apiRequest } from '../../../shared/httpClient';
import type { AuthResponse, LoginRequest, MeResponse, RegisterRequest } from '../model/types';

export function register(request: RegisterRequest): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/register', {
    method: 'POST',
    body: request,
  });
}

export function login(request: LoginRequest): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: request,
  });
}

export function logout(refreshToken: string): Promise<void> {
  return apiRequest<void>('/auth/logout', {
    method: 'POST',
    body: { refreshToken },
  });
}

export function me(): Promise<MeResponse> {
  return apiRequest<MeResponse>('/auth/me');
}
