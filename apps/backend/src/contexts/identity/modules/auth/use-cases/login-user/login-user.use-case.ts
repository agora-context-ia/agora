import { InvalidCredentialsError } from '../../domain/auth-user';
import {
  SESSION_TTL_MS,
  generateSessionToken,
  hashSessionToken,
} from '../../domain/session-token';
import type { PasswordHasherPort } from '../../ports/password-hasher.port';
import type { SessionRepositoryPort } from '../../ports/session-repository.port';
import type { UserRepositoryPort } from '../../ports/user-repository.port';
import type { AuthSessionResult } from '../register-user/register-user.use-case';

/** Login credentials as submitted by the form. */
export interface LoginUserInput {
  email: string;
  password: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Verifies credentials and opens a new session.
 * Returns the same InvalidCredentialsError for unknown email and wrong
 * password, so the response does not reveal which one failed.
 */
export class LoginUserUseCase {
  constructor(
    private readonly users: UserRepositoryPort,
    private readonly sessions: SessionRepositoryPort,
    private readonly passwordHasher: PasswordHasherPort,
  ) {}

  async execute(input: LoginUserInput): Promise<AuthSessionResult> {
    const user = await this.users.findByEmail(input.email);
    if (!user) throw new InvalidCredentialsError();

    const passwordMatches = await this.passwordHasher.compare(input.password, user.passwordHash);
    if (!passwordMatches) throw new InvalidCredentialsError();

    const sessionToken = generateSessionToken();
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    await this.sessions.create({
      userId: user.id,
      tokenHash: hashSessionToken(sessionToken),
      expiresAt,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    });
    await this.users.registerLogin(user.id);

    return {
      user: { id: user.id, email: user.email, fullName: user.fullName },
      sessionToken,
      expiresAt,
    };
  }
}
