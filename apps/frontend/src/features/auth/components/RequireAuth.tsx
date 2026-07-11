import { Navigate, Outlet } from 'react-router-dom';
import { useCurrentUser } from '../application/use-current-user';

/**
 * Private-route guard: checks the session (httpOnly cookie) against the
 * backend on first load and redirects to /login when there is no user.
 */
export function RequireAuth() {
  const { user, hasLoaded } = useCurrentUser();

  if (!hasLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Cargando…</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return <Outlet />;
}
