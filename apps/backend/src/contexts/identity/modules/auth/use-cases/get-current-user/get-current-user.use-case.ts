import type { AuthUser } from '../../domain/auth-user';
import { hashSessionToken } from '../../domain/session-token';
import type { SessionRepositoryPort } from '../../ports/session-repository.port';
import type { UserRepositoryPort } from '../../ports/user-repository.port';

/** Resolves the authenticated user from a session token, or null when invalid/expired. */
export class GetCurrentUserUseCase {
  constructor(
    private readonly users: UserRepositoryPort,
    private readonly sessions: SessionRepositoryPort,
  ) {}

  async execute(sessionToken: string): Promise<AuthUser | null> {
    const session = await this.sessions.findActiveByTokenHash(hashSessionToken(sessionToken));
    if (!session) return null;

    const user = await this.users.findById(session.userId);
    if (!user) return null;

    return { id: user.id, email: user.email, fullName: user.fullName };
  }
}
