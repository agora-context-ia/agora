import {
  EmbeddingDimensionMismatchError,
  type EmbeddingProviderPort,
} from '../ports/embedding-provider.port';

interface OllamaEmbedResponse {
  embeddings: number[][];
}

// Ollama procesa el batch entero en una request; se trocea igual para no
// mandar payloads gigantes con documentos largos.
const BATCH_SIZE = 64;

export class OllamaEmbeddingAdapter implements EmbeddingProviderPort {
  constructor(
    private readonly baseUrl: string,
    public readonly modelName: string,
    public readonly dimensions: number,
  ) {}

  async embedBatch(texts: string[]): Promise<number[][]> {
    const vectors: number[][] = [];
    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
      const batch = texts.slice(i, i + BATCH_SIZE);
      const response = await fetch(`${this.baseUrl}/api/embed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: this.modelName, input: batch }),
      });
      if (!response.ok) {
        const body = await response.text().catch(() => '');
        throw new Error(`Ollama respondió ${response.status}: ${body.slice(0, 300)}`);
      }
      const data = (await response.json()) as OllamaEmbedResponse;
      for (const vector of data.embeddings) {
        if (vector.length !== this.dimensions) {
          throw new EmbeddingDimensionMismatchError(this.dimensions, vector.length, this.modelName);
        }
        vectors.push(vector);
      }
    }
    return vectors;
  }
}
