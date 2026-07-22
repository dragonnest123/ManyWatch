const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';

type ErrorResponse = {
  error?: string;
  title?: string;
  detail?: string;
  errors?: Record<string, string[] | string>;
};

type RequestOptions = {
  method?: string;
  body?: unknown;
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
    throw new Error(await getErrorMessage(response));
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  return response.json() as Promise<TResponse>;
}