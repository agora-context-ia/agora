import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '../application/use-auth';
import { useLogin } from '../application/use-login';

/** Login page. */
export function LoginPage() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = safeReturnTo(searchParams.get('returnTo'));
  const { login, isSubmitting, error } = useLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (user) return <Navigate to={returnTo} replace />;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const success = await login({ email, password });
    if (success) navigate(returnTo, { replace: true });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-4">
      <img src="/assets/agora-logo.png" alt="Ágora" className="h-16 w-auto" />
      <Card className="w-full max-w-sm">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Iniciar sesión</CardTitle>
            <CardDescription>Entra a tu cuenta de Ágora</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-medium">
                Contraseña
              </label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Entrando…' : 'Entrar'}
            </Button>
            <p className="text-sm text-muted-foreground">
              ¿No tienes cuenta?{' '}
              <Link to={`/register?returnTo=${encodeURIComponent(returnTo)}`} className="font-medium text-foreground underline-offset-4 hover:underline">
                Regístrate
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

/** Allows only an internal application path as the post-auth destination. */
function safeReturnTo(value: string | null): string {
  return value?.startsWith('/') && !value.startsWith('//') ? value : '/';
}
