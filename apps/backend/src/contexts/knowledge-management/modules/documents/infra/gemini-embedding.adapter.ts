import {
  EmbeddingDimensionMismatchError,
  type EmbeddingProviderPort,
} from '../ports/embedding-provider.port';

interface GeminiBatchEmbedResponse {
  embeddings: Array<{ values: number[] }>;
}

// Documented limit of batchEmbedContents.
const BATCH_SIZE = 100;

/** Embeddings adapter for the Google AI Studio batchEmbedContents API. */
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
            // Matryoshka models (gemini-embedding-001: 3072 native) get
            // truncated to 768 here; text-embedding-004 is 768 natively.
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
        // Matryoshka-truncated vectors lose unit norm: always L2-renormalize
        // (a no-op if already normalized) so pgvector cosine distance stays
        // consistent.
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
