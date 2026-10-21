export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';
const REFRESH_TOKEN_STORAGE_KEY = 'manywatch.refreshToken';

export type SessionUser = {
  id: string;
  email: string;
  displayName: string;
};

let accessToken: string | null = null;
let refreshToken: string | null = localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
let onSessionExpired: (() => void) | null = null;
let refreshPromise: Promise<SessionUser | null> | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function setRefreshToken(token: string | null): void {
  refreshToken = token;

  if (token) {
    localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, token);
  } else {
    localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
  }
}

export function getRefreshToken(): string | null {
  return refreshToken;
}

export function setOnSessionExpired(callback: (() => void) | null): void {
  onSessionExpired = callback;
}

type ErrorResponse = {
  error?: string;
  title?: string;
  detail?: string;
  errors?: Record<string, string[] | string>;
};

export class ApiRequestError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
  }
}

type RequestOptions = {
  method?: string;
  body?: unknown;
};

type RefreshResponse = {
  userId: string;
  email: string;
  displayName: string;
  accessToken: string;
  refreshToken: string;
};

function isErrorResponse(value: unknown): value is ErrorResponse {
  return typeof value === 'object' && value !== null;
}

function getValidationMessage(errors: ErrorResponse['errors']): string {
  if (!errors) {
    return '';
  }

  return Object.values(errors)
    .flatMap((error) => (Array.isArray(error) ? error : [error]))
    .join('\n');
}

async function getErrorMessage(response: Response): Promise<string> {
  const fallbackMessage = response.statusText || 'Request failed';
  const responseText = await response.text();

  if (!responseText) {
    return fallbackMessage;
  }

  try {
    const errorBody: unknown = JSON.parse(responseText);

    if (!isErrorResponse(errorBody)) {
      return fallbackMessage;
    }

    return (
      getValidationMessage(errorBody.errors) ||
      errorBody.error ||
      errorBody.detail ||
      errorBody.title ||
      fallbackMessage
    );
  } catch {
    return responseText || fallbackMessage;
  }
}

function sendRequest(path: string, options: RequestOptions): Promise<Response> {
  return fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
}

async function readResponse<TResponse>(response: Response): Promise<TResponse> {
  if (!response.ok) {
    throw new ApiRequestError(await getErrorMessage(response), response.status);
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  return response.json() as Promise<TResponse>;
}

export async function refreshSession(): Promise<SessionUser | null> {
  if (!refreshToken) {
    return null;
  }

  refreshPromise ??= performRefresh(refreshToken).finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

async function performRefresh(token: string): Promise<SessionUser | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: token }),
    });

    if (!response.ok) {
      throw new Error('Refresh failed');
    }

    const data = (await response.json()) as RefreshResponse;
    setAccessToken(data.accessToken);
    setRefreshToken(data.refreshToken);
    return { id: data.userId, email: data.email, displayName: data.displayName };
  } catch {
    // Another concurrent refresh may have already rotated this token and stored a
    // newer, valid one — only tear down the session if ours is still the active token.
    if (refreshToken === token) {
      setAccessToken(null);
      setRefreshToken(null);
      onSessionExpired?.();
    }

    return null;
  }
}

export async function apiRequest<TResponse>(
    path: string,
    options: RequestOptions = {},
): Promise<TResponse> {
  const response = await sendRequest(path, options);

  if (response.status === 401 && path !== '/auth/refresh' && (await refreshSession()) !== null) {
    const retryResponse = await sendRequest(path, options);
    return readResponse<TResponse>(retryResponse);
  }

  return readResponse<TResponse>(response);
}
