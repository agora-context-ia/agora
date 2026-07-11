import type { AuthUser } from '../../domain/auth-user';
import type { UserRepositoryPort } from '../../ports/user-repository.port';

export interface UpdateProfileInput {
  userId: string;
  fullName: string;
}

export class UpdateProfileUseCase {
  constructor(private readonly users: UserRepositoryPort) {}

  async execute(input: UpdateProfileInput): Promise<AuthUser> {
    const user = await this.users.updateProfile(input.userId, {
      fullName: input.fullName,
    });
    return { id: user.id, email: user.email, fullName: user.fullName };
  }
}
