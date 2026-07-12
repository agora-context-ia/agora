import type { ChatMode } from './chat';

/**
 * How much documentation context a chat turn retrieves: number of
 * fragments requested and the minimum cosine similarity a fragment needs
 * to enter the prompt.
 */
export interface RetrievalProfile {
  /** Maximum fragments injected into the system prompt. */
  chunks: number;
  /** Fragments scoring below this similarity are dropped as unrelated. */
  minRelevance: number;
}

/**
 * Retrieval profile per chat mode. Hardcoded for now (same decision as
 * the prompt templates): once they need UI editing they move to org-level
 * settings.
 *
 * Rationale: precision modes (general questions, business rules) keep the
 * baseline calibrated for nomic-embed-text (8 fragments, 0.58 — see
 * EmbeddingContextSearchAdapter). Broad modes that compare or condense
 * material (summary, contradiction detection) trade precision for
 * coverage: more fragments with a slightly lower threshold. Thresholds
 * are only ever lowered from the baseline, never raised, so no mode loses
 * context the previous fixed configuration would have included.
 */
export const MODE_RETRIEVAL: Record<ChatMode, RetrievalProfile> = {
  general: { chunks: 8, minRelevance: 0.58 },
  'explain-process': { chunks: 10, minRelevance: 0.55 },
  'design-requirement': { chunks: 10, minRelevance: 0.55 },
  summary: { chunks: 14, minRelevance: 0.52 },
  'explain-rules': { chunks: 8, minRelevance: 0.58 },
  'detect-contradictions': { chunks: 16, minRelevance: 0.52 },
  'acceptance-criteria': { chunks: 10, minRelevance: 0.55 },
};
