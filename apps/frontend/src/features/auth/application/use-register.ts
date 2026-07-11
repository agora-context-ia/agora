import { useState } from 'react';
import { AuthApiError, authApiAdapter } from '../infra/http-auth-api.adapter';
import type { RegisterInput } from '../ports/auth-api.port';
import { useAuthStore } from './use-auth';

/** Submits the registration form and stores the session user. */
export function useRegister() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setUser = useAuthStore((state) => state.setUser);

  const register = async (input: RegisterInput): Promise<boolean> => {
    setIsSubmitting(true);
    setError(null);
    try {
      const user = await authApiAdapter.register(input);
      setUser(user);
      return true;
    } catch (err) {
      setError(err instanceof AuthApiError ? err.message : 'No se pudo conectar con el servidor');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { register, isSubmitting, error };
}
