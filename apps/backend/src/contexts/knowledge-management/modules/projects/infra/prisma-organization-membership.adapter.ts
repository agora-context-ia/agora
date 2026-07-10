import { prisma } from '../../../../../infrastructure/persistence/prisma-client';
import type { OrganizationMembershipPort } from '../ports/organization-membership.port';

export class PrismaOrganizationMembershipAdapter implements OrganizationMembershipPort {
  async isMember(userId: string, organizationId: string): Promise<boolean> {
    const membership = await prisma.organizationMember.findFirst({
      where: {
        userId,
        organizationId,
        status: true,
        deletedAt: null,
        organization: { status: true, deletedAt: null },
      },
      select: { id: true },
    });
    return membership !== null;
  }
}
