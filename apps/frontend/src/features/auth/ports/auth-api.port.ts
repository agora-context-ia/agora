import type { User } from '../domain/user';

/** Registration form payload. */
export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

/** Login form payload. */
export interface LoginInput {
  email: string;
  password: string;
}

/** API client contract for the auth feature. */
export interface AuthApiPort {
  register(input: RegisterInput): Promise<User>;
  login(input: LoginInput): Promise<User>;
  getCurrentUser(): Promise<User | null>;
  logout(): Promise<void>;
}
