import type { ChatSource } from '../domain/chat';

/**
 * Semantic retrieval over the documents of a space. Hides how context is
 * found (embeddings, keyword search, etc.) from the chat use cases.
 */
export interface ContextSearchPort {
  /**
   * Returns up to `limit` fragments relevant to `query`, ordered by
   * descending relevance. Fragments come back full-length; callers decide
   * how much of them to expose. When `minRelevance` is given, fragments
   * scoring below it are dropped; otherwise the adapter applies its
   * calibrated default threshold.
   */
  search(
    spaceId: string,
    query: string,
    limit: number,
    minRelevance?: number,
  ): Promise<ChatSource[]>;
}
