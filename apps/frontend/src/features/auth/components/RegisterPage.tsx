import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '../application/use-auth';
import { useRegister } from '../application/use-register';

const PASSWORD_MIN_LENGTH = 8;

/** Account creation page. */
export function RegisterPage() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = safeReturnTo(searchParams.get('returnTo'));
  const { register, isSubmitting, error } = useRegister();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  if (user) return <Navigate to={returnTo} replace />;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (password.length < PASSWORD_MIN_LENGTH) {
      setValidationError(`La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres`);
      return;
    }
    setValidationError(null);
    const success = await register({ name, email, password });
    if (success) navigate(returnTo, { replace: true });
  };

  const message = validationError ?? error;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-4">
      <img src="/assets/agora-logo.png" alt="Ágora" className="h-16 w-auto" />
      <Card className="w-full max-w-sm">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Crear cuenta</CardTitle>
            <CardDescription>Regístrate en Ágora</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="name" className="text-sm font-medium">
                Nombre completo
              </label>
              <Input
                id="name"
                autoComplete="name"
                required
                minLength={2}
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>
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
                autoComplete="new-password"
                required
                minLength={PASSWORD_MIN_LENGTH}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            {message && <p className="text-sm text-destructive">{message}</p>}
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Creando cuenta…' : 'Crear cuenta'}
            </Button>
            <p className="text-sm text-muted-foreground">
              ¿Ya tienes cuenta?{' '}
              <Link to={`/login?returnTo=${encodeURIComponent(returnTo)}`} className="font-medium text-foreground underline-offset-4 hover:underline">
                Inicia sesión
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
