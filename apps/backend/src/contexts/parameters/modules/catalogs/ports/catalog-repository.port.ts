import type { CatalogItem } from '../domain/catalog';

/** Read-only access to parameter catalogs. */
export interface CatalogRepositoryPort {
  catalogExists(catalogCode: string): Promise<boolean>;
  listItems(catalogCode: string): Promise<CatalogItem[]>;
}
