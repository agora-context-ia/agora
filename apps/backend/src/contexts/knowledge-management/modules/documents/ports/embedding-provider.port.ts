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
 * What the texts are being embedded for. Retrieval models are asymmetric:
 * documents and queries must be embedded differently (nomic prefixes,
 * Gemini taskType) or ranking quality degrades. Adapters translate the
 * purpose into their provider's mechanism.
 */
export type EmbeddingPurpose = 'document' | 'query';

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
  embedBatch(texts: string[], purpose: EmbeddingPurpose): Promise<number[][]>;
}
