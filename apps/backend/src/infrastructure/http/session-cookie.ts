import type { CookieOptions, Response } from 'express';
import { env } from '../config/env';

/** Name of the httpOnly cookie that carries the opaque session token. */
export const SESSION_COOKIE_NAME = 'contexthub_session';

// httpOnly: unreachable from JS (mitigates XSS). sameSite lax: not sent on
// cross-site requests except top-level navigation (mitigates CSRF).
// secure: https only (disabled locally because the dev server is http).
function baseOptions(): CookieOptions {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.COOKIE_SECURE,
    path: '/',
  };
}

/** Sets the session cookie with the same expiry as the DB session row. */
export function setSessionCookie(res: Response, token: string, expiresAt: Date): void {
  res.cookie(SESSION_COOKIE_NAME, token, { ...baseOptions(), expires: expiresAt });
}

/** Clears the session cookie; options must match the ones used to set it. */
export function clearSessionCookie(res: Response): void {
  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.COOKIE_SECURE,
    path: '/',
  });
}
