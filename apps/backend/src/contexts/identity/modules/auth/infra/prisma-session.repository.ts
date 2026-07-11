import { prisma } from '../../../../../infrastructure/persistence/prisma-client';
import type {
  ActiveSession,
  CreateSessionInput,
  SessionRepositoryPort,
} from '../ports/session-repository.port';

/** Prisma-backed session store (security.sessions). */
export class PrismaSessionRepository implements SessionRepositoryPort {
  async create(input: CreateSessionInput): Promise<void> {
    await prisma.session.create({
      data: {
        userId: input.userId,
        refreshTokenHash: input.tokenHash,
        expiresAt: input.expiresAt,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      },
    });
  }

  async findActiveByTokenHash(tokenHash: string): Promise<ActiveSession | null> {
    const session = await prisma.session.findFirst({
      where: {
        refreshTokenHash: tokenHash,
        revokedAt: null,
        deletedAt: null,
        status: true,
        expiresAt: { gt: new Date() },
      },
    });
    return session ? { id: session.id, userId: session.userId } : null;
  }

  async revokeByTokenHash(tokenHash: string): Promise<void> {
    await prisma.session.updateMany({
      where: { refreshTokenHash: tokenHash, revokedAt: null },
      data: { revokedAt: new Date(), status: false },
    });
  }
}
