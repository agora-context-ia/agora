export interface ChunkWithEmbedding {
  chunkIndex: number;
  content: string;
  tokenCount: number;
  embedding: number[];
}

export interface SemanticSearchHit {
  documentId: string;
  fileName: string;
  chunkIndex: number;
  content: string;
  score: number;
}

export interface EmbeddingRepositoryPort {
  /**
   * Reemplaza chunks + embeddings de una fuente en una transacción (borra lo
   * anterior e inserta lo nuevo). Son datos derivados del archivo: se borran
   * en duro, sin soft delete.
   */
  replaceForSource(
    sourceId: string,
    spaceId: string,
    chunks: ChunkWithEmbedding[],
    modelName: string,
  ): Promise<void>;

  deleteForSource(sourceId: string): Promise<void>;

  /** Búsqueda por similitud coseno, SIEMPRE filtrada por espacio y modelo. */
  search(
    spaceId: string,
    queryEmbedding: number[],
    modelName: string,
    limit: number,
  ): Promise<SemanticSearchHit[]>;
}
