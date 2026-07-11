import { hashSessionToken } from '../../domain/session-token';
import type { SessionRepositoryPort } from '../../ports/session-repository.port';

/** Revokes the session matching the cookie token; idempotent. */
export class LogoutUserUseCase {
  constructor(private readonly sessions: SessionRepositoryPort) {}

  async execute(sessionToken: string): Promise<void> {
    await this.sessions.revokeByTokenHash(hashSessionToken(sessionToken));
  }
}
