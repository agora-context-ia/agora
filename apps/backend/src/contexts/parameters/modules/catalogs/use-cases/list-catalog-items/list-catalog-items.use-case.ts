import { CatalogNotFoundError, type CatalogItem } from '../../domain/catalog';
import type { CatalogRepositoryPort } from '../../ports/catalog-repository.port';

export class ListCatalogItemsUseCase {
  constructor(private readonly catalogs: CatalogRepositoryPort) {}

  async execute(catalogCode: string): Promise<CatalogItem[]> {
    const exists = await this.catalogs.catalogExists(catalogCode);
    if (!exists) throw new CatalogNotFoundError(catalogCode);
    return this.catalogs.listItems(catalogCode);
  }
}
