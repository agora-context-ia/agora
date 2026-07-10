import type { CatalogItem } from '../domain/catalog';

export interface CatalogRepositoryPort {
  catalogExists(catalogCode: string): Promise<boolean>;
  listItems(catalogCode: string): Promise<CatalogItem[]>;
}
