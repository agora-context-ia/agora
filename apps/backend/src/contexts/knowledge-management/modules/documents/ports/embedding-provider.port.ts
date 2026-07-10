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
 * Proveedor de embeddings intercambiable (Ollama local, API de Gemini, etc.).
 * Contrato: todos los vectores devueltos tienen exactamente `dimensions`
 * componentes (768: ver plan-carga-documentos.md); `modelName` se persiste
 * junto a cada vector porque embeddings de modelos distintos viven en
 * espacios vectoriales distintos y nunca se mezclan en una búsqueda.
 */
export interface EmbeddingProviderPort {
  readonly modelName: string;
  readonly dimensions: number;
  embedBatch(texts: string[]): Promise<number[][]>;
}
