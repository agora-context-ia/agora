import { useState } from 'react';
import { AuthApiError, authApiAdapter } from '../infra/http-auth-api.adapter';
import type { LoginInput } from '../ports/auth-api.port';
import { useAuthStore } from './use-auth';

/** Submits login credentials and stores the session user. */
export function useLogin() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setUser = useAuthStore((state) => state.setUser);

  const login = async (input: LoginInput): Promise<boolean> => {
    setIsSubmitting(true);
    setError(null);
    try {
      const user = await authApiAdapter.login(input);
      setUser(user);
      return true;
    } catch (err) {
      setError(err instanceof AuthApiError ? err.message : 'No se pudo conectar con el servidor');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { login, isSubmitting, error };
}
