import { createHash, randomBytes } from 'node:crypto';

/** Session duration: 7 days. The cookie and the security.sessions row share this TTL. */
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Opaque token that travels in the httpOnly cookie. Only its sha256 hash
 * is stored in the database (a leaked table yields unusable tokens).
 */
export function generateSessionToken(): string {
  return randomBytes(32).toString('base64url');
}

/** Hashes a session token the way it is stored and looked up in the DB. */
export function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
