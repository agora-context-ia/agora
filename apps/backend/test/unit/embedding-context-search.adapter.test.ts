import { describe, expect, it } from 'vitest';
import {
  EmbeddingContextSearchAdapter,
  MIN_RELEVANCE,
} from '../../src/contexts/ai/modules/chat/infra/embedding-context-search.adapter';
import type {
  EmbeddingRepositoryPort,
  SemanticSearchHit,
} from '../../src/contexts/knowledge-management/modules/documents/ports/embedding-repository.port';
import { FakeEmbeddingProvider } from './fakes/fake-document-module';

class StubEmbeddingRepository implements EmbeddingRepositoryPort {
  hits: SemanticSearchHit[] = [];
  async replaceForSource(): Promise<void> {}
  async deleteForSource(): Promise<void> {}
  async search(): Promise<SemanticSearchHit[]> {
    return this.hits;
  }
}

function hit(fileName: string, score: number): SemanticSearchHit {
  return { documentId: 'doc-1', fileName, chunkIndex: 0, content: `contenido ${fileName}`, score };
}

describe('EmbeddingContextSearchAdapter', () => {
  it('embeds the question as a query and maps hits to chat sources', async () => {
    const provider = new FakeEmbeddingProvider();
    const repository = new StubEmbeddingRepository();
    repository.hits = [hit('Manual.pdf', 0.82)];
    const adapter = new EmbeddingContextSearchAdapter(provider, repository);

    const sources = await adapter.search('space-1', '¿cómo doy de alta?', 5);

    expect(provider.purposes).toEqual(['query']);
    expect(sources).toEqual([
      { documentName: 'Manual.pdf', fragment: 'contenido Manual.pdf', relevance: 0.82 },
    ]);
  });

  it('drops hits below the relevance floor instead of injecting noise', async () => {
    const provider = new FakeEmbeddingProvider();
    const repository = new StubEmbeddingRepository();
    repository.hits = [
      hit('Relevante.pdf', MIN_RELEVANCE + 0.1),
      hit('Borde.pdf', MIN_RELEVANCE),
      hit('Ruido.pdf', MIN_RELEVANCE - 0.01),
    ];
    const adapter = new EmbeddingContextSearchAdapter(provider, repository);

    const sources = await adapter.search('space-1', 'consulta sin relación', 5);

    expect(sources.map((source) => source.documentName)).toEqual(['Relevante.pdf', 'Borde.pdf']);
  });
});
