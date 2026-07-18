import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useCurrentUser } from '@/features/auth/application/use-current-user';
import { ApiError } from '@/lib/api';
import { collaborationApiAdapter } from '../infra/http-collaboration-api.adapter';

/** Authenticated landing page that consumes a one-time invitation token. */
export function AcceptInvitationPage() {
  const [params] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setLoading] = useState(false);
  const hasStarted = useRef(false);
  const { user, hasLoaded } = useCurrentUser();
  const token = params.get('token');
  const returnTo = `/invitations/accept?token=${encodeURIComponent(token ?? '')}`;

  async function accept() {
    if (!token) return;
    setLoading(true);
    try { await collaborationApiAdapter.accept(token); window.location.assign('/'); }
    catch (cause) { setError(cause instanceof ApiError ? cause.message : 'No se pudo aceptar la invitación'); setLoading(false); }
  }

  useEffect(() => {
    if (!hasLoaded || !user || !token || hasStarted.current) return;
    hasStarted.current = true;
    void accept();
  }, [hasLoaded, token, user]);

  return <main className="flex min-h-screen items-center justify-center bg-muted/30 p-6"><div className="w-full max-w-md space-y-4 rounded-lg border bg-background p-6 text-center"><h1 className="text-xl font-semibold">Invitación a una organización</h1><p className="text-sm text-muted-foreground">Al continuar podrás ver sus proyectos y documentación compartida.</p>{!hasLoaded || isLoading ? <p className="text-sm text-muted-foreground">Aceptando invitación…</p> : !token ? <p className="text-sm text-destructive">El enlace de invitación no es válido.</p> : !user ? <div className="flex flex-col gap-2"><Button asChild><Link to={`/register?returnTo=${encodeURIComponent(returnTo)}`}>Crear cuenta y aceptar</Link></Button><Button asChild variant="outline"><Link to={`/login?returnTo=${encodeURIComponent(returnTo)}`}>Iniciar sesión y aceptar</Link></Button></div> : null}{error && <div className="space-y-3"><p className="text-sm text-destructive">{error}</p><Button variant="outline" onClick={() => window.location.assign('/')}>Ir al inicio</Button></div>}</div></main>;
}
