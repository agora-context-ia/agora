import type { EmbeddingProviderPort } from '../../../../knowledge-management/modules/documents/ports/embedding-provider.port';
import type { EmbeddingRepositoryPort } from '../../../../knowledge-management/modules/documents/ports/embedding-repository.port';
import type { ChatSource } from '../domain/chat';
import type { ContextSearchPort } from '../ports/context-search.port';

/**
 * Anti-corruption adapter: implements the chat's {@link ContextSearchPort}
 * by composing the knowledge-management embedding ports. This is the only
 * place where the chat module touches another context, as allowed for
 * `infra/` adapters (see AGENTS.md dependency rules).
 */
export class EmbeddingContextSearchAdapter implements ContextSearchPort {
  constructor(
    private readonly embeddingProvider: EmbeddingProviderPort,
    private readonly embeddings: EmbeddingRepositoryPort,
  ) {}

  async search(spaceId: string, query: string, limit: number): Promise<ChatSource[]> {
    const [queryEmbedding] = await this.embeddingProvider.embedBatch([query]);
    const hits = await this.embeddings.search(
      spaceId,
      queryEmbedding,
      this.embeddingProvider.modelName,
      limit,
    );
    return hits.map((hit) => ({
      documentName: hit.fileName,
      fragment: hit.content,
      relevance: hit.score,
    }));
  }
}
