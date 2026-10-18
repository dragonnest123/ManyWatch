export type AuthUser = {
  id: string;
  email: string;
  displayName: string;
};

export type RegisterRequest = {
  email: string;
  password: string;
  displayName: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type AuthResponse = {
  userId: string;
  email: string;
  displayName: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
};

export type MeResponse = {
  userId: string;
  email: string;
  displayName: string;
  createdAt: string;
};
