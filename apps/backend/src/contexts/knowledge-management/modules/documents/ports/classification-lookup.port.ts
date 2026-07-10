// Puerto hacia el schema parameters: resolver un code de clasificación del
// catálogo DOCUMENT_CLASSIFICATION a su ítem, sin acoplar el módulo al
// modelo de catálogos.
export interface ClassificationItem {
  id: string;
  code: string;
  name: string;
}

export interface ClassificationLookupPort {
  findByCode(code: string): Promise<ClassificationItem | null>;
}
