import type { CookieOptions, Response } from 'express';
import { env } from '../config/env';

export const SESSION_COOKIE_NAME = 'contexthub_session';

// httpOnly: inaccesible desde JS (mitiga XSS). sameSite lax: no viaja en
// requests cross-site salvo navegación top-level (mitiga CSRF). secure:
// solo https (desactivado en local porque el dev server es http).
function baseOptions(): CookieOptions {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.COOKIE_SECURE,
    path: '/',
  };
}

export function setSessionCookie(res: Response, token: string, expiresAt: Date): void {
  res.cookie(SESSION_COOKIE_NAME, token, { ...baseOptions(), expires: expiresAt });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.COOKIE_SECURE,
    path: '/',
  });
}
