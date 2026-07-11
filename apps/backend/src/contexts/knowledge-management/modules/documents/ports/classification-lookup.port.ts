/** An item of the DOCUMENT_CLASSIFICATION catalog. */
export interface ClassificationItem {
  id: string;
  code: string;
  name: string;
}

/**
 * Port towards the parameters schema: resolves a classification code from
 * the DOCUMENT_CLASSIFICATION catalog to its item, without coupling this
 * module to the catalogs model.
 */
export interface ClassificationLookupPort {
  findByCode(code: string): Promise<ClassificationItem | null>;
}
