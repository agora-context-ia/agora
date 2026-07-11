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

/** Persistence contract for context documents and their sources. */
export interface DocumentRepositoryPort {
  /** Creates the source (type 'file') + the document in pending state, in one transaction. */
  createWithSource(data: CreateDocumentData): Promise<ContextDocumentEntity>;
  updateFilePath(documentId: string, filePath: string): Promise<void>;
  listBySpace(spaceId: string): Promise<ContextDocumentEntity[]>;
  findById(documentId: string): Promise<ContextDocumentEntity | null>;
  setProcessingStatus(
    documentId: string,
    processingStatus: DocumentProcessingStatus,
    processingError?: string | null,
  ): Promise<void>;
  /** Soft-deletes document + source (chunks/embeddings are removed via EmbeddingRepository). */
  softDelete(documentId: string): Promise<void>;
}
