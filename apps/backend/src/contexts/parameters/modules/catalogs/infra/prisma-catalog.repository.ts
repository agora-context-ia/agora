import { prisma } from '../../../../../infrastructure/persistence/prisma-client';
import type { CatalogItem } from '../domain/catalog';
import type { CatalogRepositoryPort } from '../ports/catalog-repository.port';

export class PrismaCatalogRepository implements CatalogRepositoryPort {
  async catalogExists(catalogCode: string): Promise<boolean> {
    const catalog = await prisma.catalog.findFirst({
      where: { code: catalogCode, status: true, deletedAt: null },
      select: { id: true },
    });
    return catalog !== null;
  }

  async listItems(catalogCode: string): Promise<CatalogItem[]> {
    const items = await prisma.catalogItem.findMany({
      where: {
        status: true,
        deletedAt: null,
        catalog: { code: catalogCode, status: true, deletedAt: null },
      },
      select: { code: true, name: true, description: true, sortOrder: true },
      orderBy: { sortOrder: 'asc' },
    });
    return items;
  }
}
