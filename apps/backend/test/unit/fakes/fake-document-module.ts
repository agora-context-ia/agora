// In-memory fakes shared by the documents module tests.
import {
  UnsupportedFileTypeError,
  type ContextDocumentEntity,
  type DocumentProcessingStatus,
} from '../../../src/contexts/knowledge-management/modules/documents/domain/document';
import type {
  ClassificationItem,
  ClassificationLookupPort,
} from '../../../src/contexts/knowledge-management/modules/documents/ports/classification-lookup.port';
import type { DocumentProcessingQueuePort } from '../../../src/contexts/knowledge-management/modules/documents/ports/document-processing-queue.port';
import type {
  CreateDocumentData,
  DocumentRepositoryPort,
} from '../../../src/contexts/knowledge-management/modules/documents/ports/document-repository.port';
import type {
  EmbeddingProviderPort,
  EmbeddingPurpose,
} from '../../../src/contexts/knowledge-management/modules/documents/ports/embedding-provider.port';
import type {
  ChunkWithEmbedding,
  EmbeddingRepositoryPort,
  SemanticSearchHit,
} from '../../../src/contexts/knowledge-management/modules/documents/ports/embedding-repository.port';
import type {
  DocumentUpdatedEvent,
  RealtimeNotifierPort,
} from '../../../src/contexts/knowledge-management/modules/documents/ports/realtime-notifier.port';
import type { SpaceAccessPort } from '../../../src/contexts/knowledge-management/modules/documents/ports/space-access.port';
import type { TextExtractionPort } from '../../../src/contexts/knowledge-management/modules/documents/ports/text-extraction.port';
import type { OrganizationMembershipPort } from '../../../src/contexts/knowledge-management/modules/projects/ports/organization-membership.port';

export class FakeDocumentRepository implements DocumentRepositoryPort {
  readonly documents: ContextDocumentEntity[] = [];
  private sequence = 1;

  seed(overrides: Partial<ContextDocumentEntity> = {}): ContextDocumentEntity {
    const id = `doc-${this.sequence++}`;
    const document: ContextDocumentEntity = {
      id,
      sourceId: `source-${id}`,
      spaceId: 'space-1',
      fileName: 'archivo.txt',
      filePath: `org-1/space-1/${id}.txt`,
      mimeType: 'text/plain',
      fileSizeBytes: 10,
      processingStatus: 'pending',
      processingError: null,
      classification: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
    this.documents.push(document);
    return document;
  }

  async createWithSource(data: CreateDocumentData): Promise<ContextDocumentEntity> {
    return this.seed({
      spaceId: data.spaceId,
      fileName: data.fileName,
      filePath: '',
      mimeType: data.mimeType,
      fileSizeBytes: data.fileSizeBytes,
      classification: data.classificationId
        ? { code: 'SEEDED', name: 'Seeded' }
        : null,
    });
  }

  async updateFilePath(documentId: string, filePath: string): Promise<void> {
    const document = this.documents.find((item) => item.id === documentId);
    if (document) document.filePath = filePath;
  }

  async listBySpace(spaceId: string): Promise<ContextDocumentEntity[]> {
    return this.documents.filter((item) => item.spaceId === spaceId);
  }

  async findById(documentId: string): Promise<ContextDocumentEntity | null> {
    return this.documents.find((item) => item.id === documentId) ?? null;
  }

  async setProcessingStatus(
    documentId: string,
    processingStatus: DocumentProcessingStatus,
    processingError: string | null = null,
  ): Promise<void> {
    const document = this.documents.find((item) => item.id === documentId);
    if (document) {
      document.processingStatus = processingStatus;
      document.processingError = processingError;
    }
  }

  async softDelete(documentId: string): Promise<void> {
    const index = this.documents.findIndex((item) => item.id === documentId);
    if (index >= 0) this.documents.splice(index, 1);
  }
}

export class FakeMembership implements OrganizationMembershipPort {
  constructor(private readonly memberships: Array<[string, string]>) {}
  async isMember(userId: string, organizationId: string): Promise<boolean> {
    return this.memberships.some(([u, o]) => u === userId && o === organizationId);
  }
}

export class FakeSpaceAccess implements SpaceAccessPort {
  constructor(private readonly spaceOrgs: Record<string, string>) {}
  async findSpaceOrganization(spaceId: string): Promise<string | null> {
    return this.spaceOrgs[spaceId] ?? null;
  }
}

export class FakeClassificationLookup implements ClassificationLookupPort {
  constructor(private readonly items: ClassificationItem[]) {}
  async findByCode(code: string): Promise<ClassificationItem | null> {
    return this.items.find((item) => item.code === code) ?? null;
  }
}

export class FakeFileStorage {
  readonly saved = new Map<string, Buffer>();

  buildPath(orgId: string, spaceId: string, documentId: string, fileName: string): string {
    const ext = fileName.includes('.') ? `.${fileName.split('.').pop()}` : '';
    return `${orgId}/${spaceId}/${documentId}${ext}`;
  }
  async save(relativePath: string, buffer: Buffer): Promise<void> {
    this.saved.set(relativePath, buffer);
  }
  async read(relativePath: string): Promise<Buffer> {
    const buffer = this.saved.get(relativePath);
    if (!buffer) throw new Error(`Archivo no encontrado: ${relativePath}`);
    return buffer;
  }
  async remove(relativePath: string): Promise<void> {
    this.saved.delete(relativePath);
  }
}

export class FakeTextExtraction implements TextExtractionPort {
  isSupported(mimeType: string): boolean {
    return mimeType.startsWith('text/');
  }
  async extract(buffer: Buffer, mimeType: string): Promise<string> {
    if (!this.isSupported(mimeType)) throw new UnsupportedFileTypeError(mimeType);
    return buffer.toString('utf-8');
  }
}

export class FakeQueue implements DocumentProcessingQueuePort {
  readonly enqueued: string[] = [];
  async enqueue(documentId: string): Promise<void> {
    this.enqueued.push(documentId);
  }
}

export class FakeEmbeddingProvider implements EmbeddingProviderPort {
  readonly modelName = 'fake-model';
  readonly dimensions = 768;
  failWith: Error | null = null;
  readonly purposes: EmbeddingPurpose[] = [];

  async embedBatch(texts: string[], purpose: EmbeddingPurpose): Promise<number[][]> {
    if (this.failWith) throw this.failWith;
    this.purposes.push(purpose);
    return texts.map(() => new Array<number>(this.dimensions).fill(0.1));
  }
}

export class FakeEmbeddingRepository implements EmbeddingRepositoryPort {
  readonly bySource = new Map<string, { chunks: ChunkWithEmbedding[]; modelName: string }>();

  async replaceForSource(
    sourceId: string,
    _spaceId: string,
    chunks: ChunkWithEmbedding[],
    modelName: string,
  ): Promise<void> {
    this.bySource.set(sourceId, { chunks, modelName });
  }
  async deleteForSource(sourceId: string): Promise<void> {
    this.bySource.delete(sourceId);
  }
  async search(): Promise<SemanticSearchHit[]> {
    return [];
  }
}

export class FakeNotifier implements RealtimeNotifierPort {
  readonly events: DocumentUpdatedEvent[] = [];
  async notifyDocumentUpdated(event: DocumentUpdatedEvent): Promise<void> {
    this.events.push(event);
  }
}
