import type { ChatSource } from '../domain/chat';

/**
 * Semantic retrieval over the documents of a space. Hides how context is
 * found (embeddings, keyword search, etc.) from the chat use cases.
 */
export interface ContextSearchPort {
  /**
   * Returns up to `limit` fragments relevant to `query`, ordered by
   * descending relevance. Fragments come back full-length; callers decide
   * how much of them to expose.
   */
  search(spaceId: string, query: string, limit: number): Promise<ChatSource[]>;
}
