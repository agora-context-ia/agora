import { EmailAlreadyInUseError, type AuthUser } from '../../domain/auth-user';
import {
  SESSION_TTL_MS,
  generateSessionToken,
  hashSessionToken,
} from '../../domain/session-token';
import type { PasswordHasherPort } from '../../ports/password-hasher.port';
import type { SessionRepositoryPort } from '../../ports/session-repository.port';
import type { UserRepositoryPort } from '../../ports/user-repository.port';

/** Registration form data; the email must not have an account yet. */
export interface RegisterUserInput {
  fullName: string;
  email: string;
  password: string;
  ipAddress?: string;
  userAgent?: string;
}

/** Authenticated user plus the session token/expiry to set as cookie. */
export interface AuthSessionResult {
  user: AuthUser;
  sessionToken: string;
  expiresAt: Date;
}

/** Creates the account (hashing the password) and opens the first session. */
export class RegisterUserUseCase {
  constructor(
    private readonly users: UserRepositoryPort,
    private readonly sessions: SessionRepositoryPort,
    private readonly passwordHasher: PasswordHasherPort,
  ) {}

  async execute(input: RegisterUserInput): Promise<AuthSessionResult> {
    const existing = await this.users.findByEmail(input.email);
    if (existing) throw new EmailAlreadyInUseError();

    const passwordHash = await this.passwordHasher.hash(input.password);
    const user = await this.users.create({
      email: input.email,
      fullName: input.fullName,
      passwordHash,
    });

    const sessionToken = generateSessionToken();
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    await this.sessions.create({
      userId: user.id,
      tokenHash: hashSessionToken(sessionToken),
      expiresAt,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    });

    return {
      user: { id: user.id, email: user.email, fullName: user.fullName },
      sessionToken,
      expiresAt,
    };
  }
}
