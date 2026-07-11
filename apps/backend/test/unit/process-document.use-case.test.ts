import { describe, expect, it } from 'vitest';
import { EmbeddingDimensionMismatchError } from '../../src/contexts/knowledge-management/modules/documents/ports/embedding-provider.port';
import { ProcessDocumentUseCase } from '../../src/contexts/knowledge-management/modules/documents/use-cases/process-document/process-document.use-case';
import {
  FakeDocumentRepository,
  FakeEmbeddingProvider,
  FakeEmbeddingRepository,
  FakeFileStorage,
  FakeNotifier,
  FakeSpaceAccess,
  FakeTextExtraction,
} from './fakes/fake-document-module';

function buildUseCase() {
  const documents = new FakeDocumentRepository();
  const embeddings = new FakeEmbeddingRepository();
  const provider = new FakeEmbeddingProvider();
  const storage = new FakeFileStorage();
  const notifier = new FakeNotifier();
  const useCase = new ProcessDocumentUseCase(
    documents,
    embeddings,
    provider,
    new FakeSpaceAccess({ 'space-1': 'org-1' }),
    storage,
    new FakeTextExtraction(),
    notifier,
  );
  return { useCase, documents, embeddings, provider, storage, notifier };
}

describe('ProcessDocumentUseCase', () => {
  it('extrae, chunkea, embebe y deja el documento en ready notificando por SSE', async () => {
    const { useCase, documents, embeddings, storage, notifier } = buildUseCase();
    const document = documents.seed();
    await storage.save(document.filePath, Buffer.from('Contenido del documento de prueba.'));

    await useCase.execute(document.id);

    expect(document.processingStatus).toBe('ready');
    const stored = embeddings.bySource.get(document.sourceId);
    expect(stored?.chunks.length).toBeGreaterThan(0);
    expect(stored?.chunks[0].embedding).toHaveLength(768);
    expect(stored?.modelName).toBe('fake-model');
    expect(notifier.events.map((event) => event.status)).toEqual(['processing', 'ready']);
    expect(notifier.events[0].organizationId).toBe('org-1');
  });

  it('marca error (y notifica) si el proveedor de embeddings falla, relanzando para reintentos', async () => {
    const { useCase, documents, provider, storage, notifier } = buildUseCase();
    const document = documents.seed();
    await storage.save(document.filePath, Buffer.from('Contenido.'));
    provider.failWith = new EmbeddingDimensionMismatchError(768, 384, 'fake-model');

    await expect(useCase.execute(document.id)).rejects.toBeInstanceOf(
      EmbeddingDimensionMismatchError,
    );
    expect(document.processingStatus).toBe('error');
    expect(document.processingError).toContain('384');
    expect(notifier.events.map((event) => event.status)).toEqual(['processing', 'error']);
  });

  it('marca error si el archivo no tiene texto extraíble', async () => {
    const { useCase, documents, storage } = buildUseCase();
    const document = documents.seed();
    await storage.save(document.filePath, Buffer.from('   '));

    await expect(useCase.execute(document.id)).rejects.toThrow();
    expect(document.processingStatus).toBe('error');
  });

  it('no hace nada si el documento fue borrado antes de procesarse', async () => {
    const { useCase, notifier } = buildUseCase();
    await useCase.execute('doc-inexistente');
    expect(notifier.events).toHaveLength(0);
  });
});
