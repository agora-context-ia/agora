import { chunkText } from '../../domain/chunker';
import { EmptyDocumentError } from '../../domain/document';
import type { DocumentRepositoryPort } from '../../ports/document-repository.port';
import type { EmbeddingProviderPort } from '../../ports/embedding-provider.port';
import type { EmbeddingRepositoryPort } from '../../ports/embedding-repository.port';
import type { RealtimeNotifierPort } from '../../ports/realtime-notifier.port';
import type { SpaceAccessPort } from '../../ports/space-access.port';
import type { TextExtractionPort } from '../../ports/text-extraction.port';

/** Reads a stored document file back from storage. */
export interface FileReaderPort {
  read(relativePath: string): Promise<Buffer>;
}

/**
 * Runs in the worker (outside the request): extracts text, chunks it,
 * embeds the chunks and inserts the vectors. Every status transition is
 * notified over SSE.
 */
export class ProcessDocumentUseCase {
  constructor(
    private readonly documents: DocumentRepositoryPort,
    private readonly embeddings: EmbeddingRepositoryPort,
    private readonly embeddingProvider: EmbeddingProviderPort,
    private readonly spaceAccess: SpaceAccessPort,
    private readonly fileReader: FileReaderPort,
    private readonly textExtraction: TextExtractionPort,
    private readonly notifier: RealtimeNotifierPort,
  ) {}

  async execute(documentId: string): Promise<void> {
    const document = await this.documents.findById(documentId);
    if (!document) return; // deleted before processing: nothing to do

    const organizationId = await this.spaceAccess.findSpaceOrganization(document.spaceId);
    if (!organizationId) return;

    const notify = async (status: 'processing' | 'ready' | 'error') => {
      await this.notifier.notifyDocumentUpdated({
        organizationId,
        spaceId: document.spaceId,
        documentId,
        status,
      });
    };

    await this.documents.setProcessingStatus(documentId, 'processing');
    await notify('processing');

    try {
      const buffer = await this.fileReader.read(document.filePath);
      const text = await this.textExtraction.extract(buffer, document.mimeType ?? 'text/plain');
      const chunks = chunkText(text);
      if (chunks.length === 0) throw new EmptyDocumentError();

      const vectors = await this.embeddingProvider.embedBatch(
        chunks.map((chunk) => chunk.content),
      );

      await this.embeddings.replaceForSource(
        document.sourceId,
        document.spaceId,
        chunks.map((chunk, i) => ({
          chunkIndex: chunk.index,
          content: chunk.content,
          tokenCount: chunk.tokenCount,
          embedding: vectors[i],
        })),
        this.embeddingProvider.modelName,
      );

      await this.documents.setProcessingStatus(documentId, 'ready');
      await notify('ready');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      await this.documents.setProcessingStatus(documentId, 'error', message.slice(0, 1000));
      await notify('error');
      throw error; // rethrow so BullMQ applies its retries
    }
  }
}
