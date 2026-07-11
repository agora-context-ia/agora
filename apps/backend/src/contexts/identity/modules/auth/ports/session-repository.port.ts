/** Data to persist a new session row; only the token hash is stored. */
export interface CreateSessionInput {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

/** A session row that is active and not expired. */
export interface ActiveSession {
  id: string;
  userId: string;
}

/** Persistence contract for auth sessions, keyed by token hash. */
export interface SessionRepositoryPort {
  create(input: CreateSessionInput): Promise<void>;
  findActiveByTokenHash(tokenHash: string): Promise<ActiveSession | null>;
  revokeByTokenHash(tokenHash: string): Promise<void>;
}
