import type { EmbeddingProviderPort } from '../../../../knowledge-management/modules/documents/ports/embedding-provider.port';
import type { EmbeddingRepositoryPort } from '../../../../knowledge-management/modules/documents/ports/embedding-repository.port';
import type { ChatSource } from '../domain/chat';
import type { ContextSearchPort } from '../ports/context-search.port';

/**
 * Below this cosine similarity a chunk is considered unrelated to the
 * question and is dropped instead of injected into the prompt: grounded
 * answers require an empty context (which the prompt states explicitly)
 * over a noisy one. Calibrated on nomic-embed-text with task prefixes:
 * related questions score ~0.66-0.77, unrelated same-language ones
 * ~0.50-0.56. Tune per corpus if legit questions start losing context.
 */
export const MIN_RELEVANCE = 0.58;

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

  async search(
    spaceId: string,
    query: string,
    limit: number,
    minRelevance: number = MIN_RELEVANCE,
  ): Promise<ChatSource[]> {
    const [queryEmbedding] = await this.embeddingProvider.embedBatch([query], 'query');
    const hits = await this.embeddings.search(
      spaceId,
      queryEmbedding,
      this.embeddingProvider.modelName,
      limit,
    );
    return hits
      .filter((hit) => hit.score >= minRelevance)
      .map((hit) => ({
        documentName: hit.fileName,
        fragment: hit.content,
        relevance: hit.score,
      }));
  }
}
