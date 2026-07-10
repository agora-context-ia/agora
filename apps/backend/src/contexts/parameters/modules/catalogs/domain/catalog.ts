export interface CatalogItem {
  code: string;
  name: string;
  description: string | null;
  sortOrder: number;
}

export class CatalogNotFoundError extends Error {
  constructor(code: string) {
    super(`El catálogo "${code}" no existe`);
    this.name = 'CatalogNotFoundError';
  }
}
