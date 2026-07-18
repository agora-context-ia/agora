import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { BookOpenText, MessagesSquare, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '../application/use-auth';
import { useLogin } from '../application/use-login';

const HIGHLIGHTS = [
  {
    icon: BookOpenText,
    title: 'Todo tu conocimiento en un solo lugar',
    description: 'Centraliza documentos, notas y fuentes de tu equipo por proyectos y organizaciones.',
  },
  {
    icon: MessagesSquare,
    title: 'Conversa con tu información',
    description: 'Chatea con IA que responde citando tus propios documentos como fuente.',
  },
  {
    icon: Sparkles,
    title: 'Multi-proveedor de IA',
    description: 'Usa Gemini, OpenAI, Anthropic u Ollama local con las claves de tu organización.',
  },
  {
    icon: ShieldCheck,
    title: 'Privado y bajo tu control',
    description: 'Tus datos y credenciales se almacenan cifrados y nunca salen de tu infraestructura.',
  },
];

/** Login page: brand/info panel + form, split on large screens. */
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
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Brand / info panel */}
      <aside className="relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-[hsl(158,45%,20%)] via-[hsl(158,45%,26%)] to-[hsl(165,40%,34%)] px-6 py-8 text-white lg:w-1/2 lg:px-14 lg:py-12">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/5"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-white/5"
        />

        <div className="relative">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-2xl font-bold text-[hsl(158,45%,26%)] lg:h-12 lg:w-12 lg:text-3xl">
              A
            </span>
            <span className="text-2xl font-semibold lg:text-3xl">Ágora</span>
          </div>
          <h1 className="mt-6 max-w-md text-2xl font-semibold leading-tight lg:mt-10 lg:text-4xl">
            El conocimiento de tu equipo, conversando contigo
          </h1>
          <p className="mt-3 max-w-md text-sm text-white/80 lg:text-base">
            Ágora reúne tus documentos y los convierte en respuestas con IA, citando siempre la
            fuente.
          </p>
        </div>

        {/* Highlights: hidden on small screens to keep the form above the fold */}
        <ul className="relative mt-8 hidden max-w-md flex-col gap-5 md:flex">
          {HIGHLIGHTS.map(({ icon: Icon, title, description }) => (
            <li key={title} className="flex items-start gap-3.5">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
                <Icon className="h-[18px] w-[18px]" />
              </span>
              <div>
                <p className="text-sm font-medium">{title}</p>
                <p className="mt-0.5 text-sm text-white/70">{description}</p>
              </div>
            </li>
          ))}
        </ul>

        <p className="relative mt-8 text-xs text-white/50">
          © {new Date().getFullYear()} Ágora · Plataforma de contexto con IA
        </p>
      </aside>

      {/* Login form panel */}
      <main className="flex flex-1 items-center justify-center bg-background p-6 lg:w-1/2 lg:p-12">
        <form onSubmit={handleSubmit} className="w-full max-w-sm">
          <h2 className="text-2xl font-semibold tracking-tight">Iniciar sesión</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">Entra a tu cuenta de Ágora</p>

          <div className="mt-8 flex flex-col gap-4">
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
            <Button type="submit" className="mt-2 w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Entrando…' : 'Entrar'}
            </Button>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            ¿No tienes cuenta?{' '}
            <Link
              to={`/register?returnTo=${encodeURIComponent(returnTo)}`}
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Regístrate
            </Link>
          </p>
        </form>
      </main>
    </div>
  );
}

/** Allows only an internal application path as the post-auth destination. */
function safeReturnTo(value: string | null): string {
  return value?.startsWith('/') && !value.startsWith('//') ? value : '/';
}
