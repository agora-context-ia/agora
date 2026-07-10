import type {
  ContextDocumentEntity,
  DocumentProcessingStatus,
} from '../domain/document';

export interface CreateDocumentData {
  spaceId: string;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  classificationId: string | null;
}

export interface DocumentRepositoryPort {
  /** Crea la fuente (type 'file') + el documento en estado pending, en una transacción. */
  createWithSource(data: CreateDocumentData): Promise<ContextDocumentEntity>;
  updateFilePath(documentId: string, filePath: string): Promise<void>;
  listBySpace(spaceId: string): Promise<ContextDocumentEntity[]>;
  findById(documentId: string): Promise<ContextDocumentEntity | null>;
  setProcessingStatus(
    documentId: string,
    processingStatus: DocumentProcessingStatus,
    processingError?: string | null,
  ): Promise<void>;
  /** Soft delete de documento + fuente (chunks/embeddings se borran vía EmbeddingRepository). */
  softDelete(documentId: string): Promise<void>;
}
