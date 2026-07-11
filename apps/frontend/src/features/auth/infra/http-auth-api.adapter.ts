import type { User } from '../domain/user';
import type { AuthApiPort, LoginInput, RegisterInput } from '../ports/auth-api.port';

const API_URL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

/** Auth-specific HTTP error with the backend message. */
export class AuthApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'AuthApiError';
  }
}

interface ApiUser {
  id: string;
  email: string;
  fullName: string;
}

function toUser(apiUser: ApiUser): User {
  return { id: apiUser.id, name: apiUser.fullName, email: apiUser.email };
}

// The session travels in an httpOnly cookie set by the backend:
// credentials 'include' makes the browser send/accept it cross-origin.
async function request(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${API_URL}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
}

async function parseError(response: Response): Promise<AuthApiError> {
  const body = (await response.json().catch(() => null)) as { error?: string } | null;
  return new AuthApiError(body?.error ?? 'Error inesperado, intenta de nuevo', response.status);
}

class HttpAuthApiAdapter implements AuthApiPort {
  async register(input: RegisterInput): Promise<User> {
    const response = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ fullName: input.name, email: input.email, password: input.password }),
    });
    if (!response.ok) throw await parseError(response);
    const body = (await response.json()) as { user: ApiUser };
    return toUser(body.user);
  }

  async login(input: LoginInput): Promise<User> {
    const response = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: input.email, password: input.password }),
    });
    if (!response.ok) throw await parseError(response);
    const body = (await response.json()) as { user: ApiUser };
    return toUser(body.user);
  }

  async getCurrentUser(): Promise<User | null> {
    const response = await request('/api/auth/me');
    if (response.status === 401) return null;
    if (!response.ok) throw await parseError(response);
    const body = (await response.json()) as { user: ApiUser };
    return toUser(body.user);
  }

  async logout(): Promise<void> {
    await request('/api/auth/logout', { method: 'POST' });
  }
}

/** HTTP implementation of the auth API port. */
export const authApiAdapter = new HttpAuthApiAdapter();
