import {
  EmbeddingDimensionMismatchError,
  type EmbeddingProviderPort,
} from '../ports/embedding-provider.port';

interface GeminiBatchEmbedResponse {
  embeddings: Array<{ values: number[] }>;
}

// Límite documentado de batchEmbedContents.
const BATCH_SIZE = 100;

export class GeminiEmbeddingAdapter implements EmbeddingProviderPort {
  constructor(
    private readonly apiKey: string,
    public readonly modelName: string,
    public readonly dimensions: number,
  ) {}

  async embedBatch(texts: string[]): Promise<number[][]> {
    const vectors: number[][] = [];
    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
      const batch = texts.slice(i, i + BATCH_SIZE);
      const url =
        `https://generativelanguage.googleapis.com/v1beta/models/` +
        `${this.modelName}:batchEmbedContents?key=${this.apiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: batch.map((text) => ({
            model: `models/${this.modelName}`,
            content: { parts: [{ text }] },
            // Modelos Matryoshka (gemini-embedding-001: 3072 nativo) se
            // truncan a 768 acá; text-embedding-004 ya es 768 nativo.
            outputDimensionality: this.dimensions,
          })),
        }),
      });
      if (!response.ok) {
        const body = await response.text().catch(() => '');
        throw new Error(`Gemini respondió ${response.status}: ${body.slice(0, 300)}`);
      }
      const data = (await response.json()) as GeminiBatchEmbedResponse;
      for (const item of data.embeddings) {
        if (item.values.length !== this.dimensions) {
          throw new EmbeddingDimensionMismatchError(
            this.dimensions,
            item.values.length,
            this.modelName,
          );
        }
        // Los vectores truncados por Matryoshka pierden norma 1: se
        // renormaliza L2 siempre (es no-op si ya venía normalizado) para
        // que la distancia coseno de pgvector sea consistente.
        vectors.push(normalizeL2(item.values));
      }
    }
    return vectors;
  }
}

function normalizeL2(vector: number[]): number[] {
  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
  if (norm === 0) return vector;
  return vector.map((value) => value / norm);
}
