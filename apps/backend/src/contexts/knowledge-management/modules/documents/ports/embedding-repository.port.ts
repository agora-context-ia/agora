/** A text chunk paired with its embedding vector, ready to persist. */
export interface ChunkWithEmbedding {
  chunkIndex: number;
  content: string;
  tokenCount: number;
  embedding: number[];
}

/** One semantic search result: the chunk plus its source document and score. */
export interface SemanticSearchHit {
  documentId: string;
  fileName: string;
  chunkIndex: number;
  content: string;
  score: number;
}

/** Persistence contract for chunks and their embedding vectors. */
export interface EmbeddingRepositoryPort {
  /**
   * Replaces a source's chunks + embeddings in one transaction (deletes
   * the previous ones and inserts the new ones). Derived data: hard
   * delete, no soft delete.
   */
  replaceForSource(
    sourceId: string,
    spaceId: string,
    chunks: ChunkWithEmbedding[],
    modelName: string,
  ): Promise<void>;

  deleteForSource(sourceId: string): Promise<void>;

  /** Cosine-similarity search, ALWAYS filtered by space and model. */
  search(
    spaceId: string,
    queryEmbedding: number[],
    modelName: string,
    limit: number,
  ): Promise<SemanticSearchHit[]>;
}
