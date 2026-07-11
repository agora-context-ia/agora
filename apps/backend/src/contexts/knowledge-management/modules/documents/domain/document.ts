export type DocumentProcessingStatus = 'pending' | 'processing' | 'ready' | 'error';

/** Classification catalog item attached to a document. */
export interface DocumentClassification {
  code: string;
  name: string;
}

/** A document uploaded to a space, with its processing state. */
export interface ContextDocumentEntity {
  id: string;
  sourceId: string;
  spaceId: string;
  fileName: string;
  filePath: string;
  mimeType: string | null;
  fileSizeBytes: number | null;
  processingStatus: DocumentProcessingStatus;
  processingError: string | null;
  classification: DocumentClassification | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Thrown when the uploaded MIME type has no extractor (HTTP 415). */
export class UnsupportedFileTypeError extends Error {
  constructor(mimeType: string) {
    super(`Tipo de archivo no soportado: ${mimeType}. Aceptados: PDF, DOCX, TXT, MD, CSV, JSON`);
    this.name = 'UnsupportedFileTypeError';
  }
}

/** Thrown when the document does not exist in the given space. */
export class DocumentNotFoundError extends Error {
  constructor() {
    super('El documento no existe en este espacio');
    this.name = 'DocumentNotFoundError';
  }
}

/** Thrown when the space does not belong to the URL organization. */
export class SpaceNotFoundInOrganizationError extends Error {
  constructor() {
    super('El espacio no existe en esta organización');
    this.name = 'SpaceNotFoundInOrganizationError';
  }
}

/** Thrown when the classification code is not in the catalog. */
export class InvalidClassificationError extends Error {
  constructor(code: string) {
    super(`La clasificación "${code}" no existe en el catálogo DOCUMENT_CLASSIFICATION`);
    this.name = 'InvalidClassificationError';
  }
}

/** Thrown when no extractable text was found in the file. */
export class EmptyDocumentError extends Error {
  constructor() {
    super('No se pudo extraer texto del archivo (¿documento vacío o escaneado sin OCR?)');
    this.name = 'EmptyDocumentError';
  }
}
