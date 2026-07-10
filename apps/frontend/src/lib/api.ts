// Cliente HTTP mínimo hacia el backend. La sesión viaja en una cookie
// httpOnly, por eso todas las requests llevan credentials: 'include'.
const API_URL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

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
  // Con FormData el browser arma solo el Content-Type (incluye el boundary
  // del multipart): forzar application/json lo rompería.
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
