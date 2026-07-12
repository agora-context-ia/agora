import {
  EmbeddingDimensionMismatchError,
  type EmbeddingProviderPort,
  type EmbeddingPurpose,
} from '../ports/embedding-provider.port';

interface OllamaEmbedResponse {
  embeddings: number[][];
}

// Ollama handles the whole batch in one request; it is still sliced to
// avoid huge payloads with long documents.
const BATCH_SIZE = 64;

/**
 * Task prefixes required by asymmetric retrieval models. Texts embedded
 * without the prefix the model was trained with land in the wrong region
 * of the vector space and rank poorly. Models not listed here get no
 * prefix. NOTE: changing a document prefix changes stored vectors —
 * existing documents must be reprocessed.
 */
const TASK_PREFIXES: Array<{
  modelPrefix: string;
  document: string;
  query: string;
}> = [
  {
    modelPrefix: 'nomic-embed-text',
    document: 'search_document: ',
    query: 'search_query: ',
  },
  {
    // mxbai is asymmetric on the query side only.
    modelPrefix: 'mxbai-embed-large',
    document: '',
    query: 'Represent this sentence for searching relevant passages: ',
  },
];

/** Embeddings adapter for a local Ollama server (/api/embed). */
export class OllamaEmbeddingAdapter implements EmbeddingProviderPort {
  constructor(
    private readonly baseUrl: string,
    public readonly modelName: string,
    public readonly dimensions: number,
  ) {}

  async embedBatch(texts: string[], purpose: EmbeddingPurpose): Promise<number[][]> {
    const prefixed = this.applyTaskPrefix(texts, purpose);
    const vectors: number[][] = [];
    for (let i = 0; i < prefixed.length; i += BATCH_SIZE) {
      const batch = prefixed.slice(i, i + BATCH_SIZE);
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

  private applyTaskPrefix(texts: string[], purpose: EmbeddingPurpose): string[] {
    const entry = TASK_PREFIXES.find((candidate) =>
      this.modelName.startsWith(candidate.modelPrefix),
    );
    if (!entry) return texts;
    const prefix = entry[purpose];
    if (prefix === '') return texts;
    return texts.map((text) => `${prefix}${text}`);
  }
}
