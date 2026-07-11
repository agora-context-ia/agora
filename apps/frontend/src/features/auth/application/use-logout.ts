import { useState } from 'react';
import { authApiAdapter } from '../infra/http-auth-api.adapter';
import { useAuthStore } from './use-auth';

/** Ends the session server-side and clears the auth store. */
export function useLogout() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const setUser = useAuthStore((state) => state.setUser);

  const logout = async () => {
    setIsLoggingOut(true);
    try {
      await authApiAdapter.logout();
    } finally {
      // Al quedar user=null, RequireAuth redirige a /login.
      setUser(null);
      setIsLoggingOut(false);
    }
  };

  return { logout, isLoggingOut };
}
