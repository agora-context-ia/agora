import { prisma } from '../../../../../infrastructure/persistence/prisma-client';
import type { OrganizationMemberRole, OrganizationRolePort } from '../ports/organization-role.port';

/** Reads the member role from organization_members, ignoring soft-deleted rows. */
export class PrismaOrganizationRoleAdapter implements OrganizationRolePort {
  async getRole(userId: string, organizationId: string): Promise<OrganizationMemberRole | null> {
    const membership = await prisma.organizationMember.findFirst({
      where: {
        userId,
        organizationId,
        status: true,
        deletedAt: null,
        organization: { status: true, deletedAt: null },
      },
      select: { role: true },
    });
    return (membership?.role as OrganizationMemberRole | undefined) ?? null;
  }
}
