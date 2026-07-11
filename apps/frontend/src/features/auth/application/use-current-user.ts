import { useEffect } from 'react';
import { authApiAdapter } from '../infra/http-auth-api.adapter';
import { useAuthStore } from './use-auth';

/** Restores the session from the cookie on first load; exposes the user. */
export function useCurrentUser() {
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);
  const hasLoaded = useAuthStore((state) => state.hasLoaded);
  const setUser = useAuthStore((state) => state.setUser);
  const setLoading = useAuthStore((state) => state.setLoading);

  useEffect(() => {
    if (hasLoaded) return;

    let cancelled = false;
    setLoading(true);

    authApiAdapter
      .getCurrentUser()
      .then((result) => {
        if (cancelled) return;
        setUser(result);
      })
      .catch(() => {
        if (cancelled) return;
        // Backend down or network error: treated as "no session".
        setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [hasLoaded, setLoading, setUser]);

  return { user, isLoading, hasLoaded };
}
