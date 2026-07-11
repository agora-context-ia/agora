/** One selectable item of a read-only catalog, referenced by code. */
export interface CatalogItem {
  code: string;
  name: string;
  description: string | null;
  sortOrder: number;
}

/** Thrown when the requested catalog code does not exist. */
export class CatalogNotFoundError extends Error {
  constructor(code: string) {
    super(`El catálogo "${code}" no existe`);
    this.name = 'CatalogNotFoundError';
  }
}
