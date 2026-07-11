const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';

type RequestOptions = {
  method?: string;
  body?: unknown;
};

function getErrorMessage(errorBody: unknown, fallbackMessage: string): string {
  if (!errorBody || typeof errorBody !== 'object') {
    return fallbackMessage;
  }

  if ('error' in errorBody && typeof errorBody.error === 'string') {
    return errorBody.error;
  }

  if ('title' in errorBody && typeof errorBody.title === 'string') {
    fallbackMessage = errorBody.title;
  }

  if ('errors' in errorBody && errorBody.errors && typeof errorBody.errors === 'object') {
    const errors = Object.values(errorBody.errors)
        .flat()
        .filter((error): error is string => typeof error === 'string');

    if (errors.length > 0) {
      return errors.join('\n');
    }
  }

  return fallbackMessage;
}

export async function apiRequest<TResponse>(
    path: string,
    options: RequestOptions = {},
): Promise<TResponse> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    let message = response.statusText || 'Request failed';

    try {
      const errorBody = await response.json();
      message = getErrorMessage(errorBody, message);
    } catch {
      message = response.statusText || 'Request failed';
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  return response.json() as Promise<TResponse>;
}