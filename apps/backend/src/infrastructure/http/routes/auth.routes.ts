import { Router, type Request, type Response } from 'express';
import {
  EmailAlreadyInUseError,
  InvalidCredentialsError,
} from '../../../contexts/identity/modules/auth/domain/auth-user';
import { container } from '../../container';
import { requireAuth } from '../require-auth';
import {
  SESSION_COOKIE_NAME,
  clearSessionCookie,
  setSessionCookie,
} from '../session-cookie';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 8;

function requestMeta(req: Request) {
  return { ipAddress: req.ip, userAgent: req.headers['user-agent'] };
}

function readSessionToken(req: Request): string | null {
  const token = (req.cookies as Record<string, string | undefined>)[SESSION_COOKIE_NAME];
  return typeof token === 'string' && token.length > 0 ? token : null;
}

export const authRouter: Router = Router();

authRouter.post('/register', async (req: Request, res: Response) => {
  const { fullName, email, password } = (req.body ?? {}) as Record<string, unknown>;

  if (typeof fullName !== 'string' || fullName.trim().length < 2) {
    return res.status(400).json({ error: 'El nombre debe tener al menos 2 caracteres' });
  }
  if (typeof email !== 'string' || !EMAIL_REGEX.test(email)) {
    return res.status(400).json({ error: 'Email inválido' });
  }
  if (typeof password !== 'string' || password.length < PASSWORD_MIN_LENGTH) {
    return res
      .status(400)
      .json({ error: `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres` });
  }

  try {
    const result = await container.registerUser.execute({
      fullName: fullName.trim(),
      email: email.trim(),
      password,
      ...requestMeta(req),
    });
    setSessionCookie(res, result.sessionToken, result.expiresAt);
    return res.status(201).json({ user: result.user });
  } catch (error) {
    if (error instanceof EmailAlreadyInUseError) {
      return res.status(409).json({ error: error.message });
    }
    throw error;
  }
});

authRouter.post('/login', async (req: Request, res: Response) => {
  const { email, password } = (req.body ?? {}) as Record<string, unknown>;

  if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
  }

  try {
    const result = await container.loginUser.execute({
      email: email.trim(),
      password,
      ...requestMeta(req),
    });
    setSessionCookie(res, result.sessionToken, result.expiresAt);
    return res.json({ user: result.user });
  } catch (error) {
    if (error instanceof InvalidCredentialsError) {
      return res.status(401).json({ error: error.message });
    }
    throw error;
  }
});

authRouter.post('/logout', async (req: Request, res: Response) => {
  const token = readSessionToken(req);
  if (token) {
    await container.logoutUser.execute(token);
  }
  clearSessionCookie(res);
  return res.status(204).end();
});

authRouter.get('/me', requireAuth, (req: Request, res: Response) => {
  return res.json({ user: req.authUser });
});
