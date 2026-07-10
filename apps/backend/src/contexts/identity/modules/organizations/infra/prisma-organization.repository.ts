import { prisma } from '../../../../../infrastructure/persistence/prisma-client';
import {
  OrganizationSlugTakenError,
  type OrganizationRole,
  type OrganizationWithRole,
} from '../domain/organization';
import type {
  CreateOrganizationData,
  OrganizationRepositoryPort,
} from '../ports/organization-repository.port';

export class PrismaOrganizationRepository implements OrganizationRepositoryPort {
  async createWithOwner(data: CreateOrganizationData): Promise<OrganizationWithRole> {
    try {
      const organization = await prisma.$transaction(async (tx) => {
        const created = await tx.organization.create({
          data: { name: data.name, slug: data.slug, createdBy: data.createdBy },
        });
        await tx.organizationMember.create({
          data: {
            organizationId: created.id,
            userId: data.createdBy,
            role: 'owner',
            joinedAt: new Date(),
          },
        });
        return created;
      });

      return {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        role: 'owner',
      };
    } catch (error) {
      // P2002: unique violation (slug) — carrera entre slugExists y create.
      if (isUniqueViolation(error)) throw new OrganizationSlugTakenError(data.slug);
      throw error;
    }
  }

  async listByMember(userId: string): Promise<OrganizationWithRole[]> {
    const memberships = await prisma.organizationMember.findMany({
      where: {
        userId,
        status: true,
        deletedAt: null,
        organization: { status: true, deletedAt: null },
      },
      include: { organization: true },
      orderBy: { createdAt: 'asc' },
    });

    return memberships.map((membership) => ({
      id: membership.organization.id,
      name: membership.organization.name,
      slug: membership.organization.slug,
      role: membership.role as OrganizationRole,
    }));
  }

  async slugExists(slug: string): Promise<boolean> {
    const existing = await prisma.organization.findFirst({
      where: { slug, deletedAt: null },
      select: { id: true },
    });
    return existing !== null;
  }
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'P2002'
  );
}
