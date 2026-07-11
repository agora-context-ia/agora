import type { NextFunction, Request, Response } from 'express';
import type { AuthUser } from '../../contexts/identity/modules/auth/domain/auth-user';
import { container } from '../container';
import { SESSION_COOKIE_NAME, clearSessionCookie } from './session-cookie';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string;
      authUser?: AuthUser;
    }
  }
}

/**
 * Middleware for private routes: validates the session cookie and exposes
 * the authenticated user on req.userId / req.authUser.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = (req.cookies as Record<string, string | undefined>)[SESSION_COOKIE_NAME];
  if (typeof token !== 'string' || token.length === 0) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  const user = await container.getCurrentUser.execute(token);
  if (!user) {
    clearSessionCookie(res);
    return res.status(401).json({ error: 'Sesión expirada o inválida' });
  }

  req.userId = user.id;
  req.authUser = user;
  return next();
}
