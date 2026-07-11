// Minimal HTTP client towards the backend. The session travels in an
// httpOnly cookie, hence every request carries credentials: 'include'.
const API_URL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

/** HTTP error from the backend, carrying the status and server message. */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  // With FormData the browser builds the Content-Type itself (including
  // the multipart boundary): forcing application/json would break it.
  const isFormData = init?.body instanceof FormData;
  const response = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    headers: isFormData ? undefined : { 'Content-Type': 'application/json' },
    ...init,
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(body?.error ?? 'Error inesperado, intenta de nuevo', response.status);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
