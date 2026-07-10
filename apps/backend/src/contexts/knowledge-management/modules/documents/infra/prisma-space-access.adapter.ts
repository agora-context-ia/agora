import { prisma } from '../../../../../infrastructure/persistence/prisma-client';
import type { SpaceAccessPort } from '../ports/space-access.port';

export class PrismaSpaceAccessAdapter implements SpaceAccessPort {
  async findSpaceOrganization(spaceId: string): Promise<string | null> {
    const space = await prisma.space.findFirst({
      where: { id: spaceId, status: true, deletedAt: null },
      select: { organizationId: true },
    });
    return space?.organizationId ?? null;
  }
}
