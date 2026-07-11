import { prisma } from '../../../../../infrastructure/persistence/prisma-client';
import type {
  CreateUserInput,
  UpdateProfileData,
  UserRecord,
  UserRepositoryPort,
} from '../ports/user-repository.port';

/**
 * Prisma-backed user store. The email column is CITEXT in Postgres, so
 * equality comparison is already case-insensitive at the database level.
 */
export class PrismaUserRepository implements UserRepositoryPort {
  async findByEmail(email: string): Promise<UserRecord | null> {
    const user = await prisma.user.findFirst({
      where: { email, deletedAt: null, status: true },
    });
    return user ? toRecord(user) : null;
  }

  async findById(id: string): Promise<UserRecord | null> {
    const user = await prisma.user.findFirst({
      where: { id, deletedAt: null, status: true },
    });
    return user ? toRecord(user) : null;
  }

  async create(input: CreateUserInput): Promise<UserRecord> {
    const user = await prisma.user.create({
      data: {
        email: input.email,
        fullName: input.fullName,
        passwordHash: input.passwordHash,
      },
    });
    return toRecord(user);
  }

  async registerLogin(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  }

  async updateProfile(userId: string, data: UpdateProfileData): Promise<UserRecord> {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { fullName: data.fullName },
    });
    return toRecord(user);
  }
}

function toRecord(user: {
  id: string;
  email: string;
  fullName: string;
  passwordHash: string;
}): UserRecord {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    passwordHash: user.passwordHash,
  };
}
