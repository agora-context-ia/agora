import { prisma } from '../../../../../infrastructure/persistence/prisma-client';
import { SpaceSlugTakenError, type Space } from '../domain/space';
import type { CreateSpaceData, SpaceRepositoryPort } from '../ports/space-repository.port';

type SpaceRow = {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  _count: { contextDocuments: number };
};

const withDocumentCount = {
  _count: { select: { contextDocuments: { where: { deletedAt: null } } } },
} as const;

/** Prisma-backed space store (soft-delete aware, slug-unique per org). */
export class PrismaSpaceRepository implements SpaceRepositoryPort {
  async listByOrganization(organizationId: string): Promise<Space[]> {
    const spaces = await prisma.space.findMany({
      where: { organizationId, status: true, deletedAt: null },
      include: withDocumentCount,
      orderBy: { createdAt: 'desc' },
    });
    return spaces.map(toSpace);
  }

  async create(data: CreateSpaceData): Promise<Space> {
    try {
      const space = await prisma.space.create({
        data: {
          organizationId: data.organizationId,
          createdBy: data.createdBy,
          name: data.name,
          slug: data.slug,
          description: data.description,
        },
        include: withDocumentCount,
      });
      return toSpace(space);
    } catch (error) {
      // P2002: uq_spaces_org_slug violation (race between check and create).
      if (isUniqueViolation(error)) throw new SpaceSlugTakenError(data.slug);
      throw error;
    }
  }

  async slugExists(organizationId: string, slug: string): Promise<boolean> {
    const existing = await prisma.space.findFirst({
      where: { organizationId, slug, deletedAt: null },
      select: { id: true },
    });
    return existing !== null;
  }
}

function toSpace(row: SpaceRow): Space {
  return {
    id: row.id,
    organizationId: row.organizationId,
    name: row.name,
    slug: row.slug,
    description: row.description,
    documentCount: row._count.contextDocuments,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'P2002'
  );
}
