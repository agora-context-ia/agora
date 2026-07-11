/** Thrown when a provider returns vectors of an unexpected dimensionality. */
export class EmbeddingDimensionMismatchError extends Error {
  constructor(expected: number, received: number, modelName: string) {
    super(
      `El modelo de embeddings "${modelName}" devolvió vectores de ${received} dims ` +
        `pero la base espera ${expected}. Revisar EMBEDDING_MODEL/EMBEDDING_DIM.`,
    );
    this.name = 'EmbeddingDimensionMismatchError';
  }
}

/**
 * Swappable embeddings provider (local Ollama, Gemini API, etc.).
 * Contract: every returned vector has exactly `dimensions` components;
 * `modelName` is persisted next to each vector because embeddings from
 * different models live in different vector spaces and are never mixed in
 * one search.
 */
export interface EmbeddingProviderPort {
  readonly modelName: string;
  readonly dimensions: number;
  embedBatch(texts: string[]): Promise<number[][]>;
}
