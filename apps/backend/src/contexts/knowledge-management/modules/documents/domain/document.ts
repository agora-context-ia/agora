export type DocumentProcessingStatus = 'pending' | 'processing' | 'ready' | 'error';

export interface DocumentClassification {
  code: string;
  name: string;
}

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

export class UnsupportedFileTypeError extends Error {
  constructor(mimeType: string) {
    super(`Tipo de archivo no soportado: ${mimeType}. Aceptados: PDF, DOCX, TXT, MD, CSV, JSON`);
    this.name = 'UnsupportedFileTypeError';
  }
}

export class DocumentNotFoundError extends Error {
  constructor() {
    super('El documento no existe en este espacio');
    this.name = 'DocumentNotFoundError';
  }
}

export class SpaceNotFoundInOrganizationError extends Error {
  constructor() {
    super('El espacio no existe en esta organización');
    this.name = 'SpaceNotFoundInOrganizationError';
  }
}

export class InvalidClassificationError extends Error {
  constructor(code: string) {
    super(`La clasificación "${code}" no existe en el catálogo DOCUMENT_CLASSIFICATION`);
    this.name = 'InvalidClassificationError';
  }
}

export class EmptyDocumentError extends Error {
  constructor() {
    super('No se pudo extraer texto del archivo (¿documento vacío o escaneado sin OCR?)');
    this.name = 'EmptyDocumentError';
  }
}
