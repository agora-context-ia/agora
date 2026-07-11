/**
 * Character-based chunking approximating tokens (~4 chars/token, a
 * reasonable heuristic for es/en). Targets ~500 tokens with ~80 of
 * overlap so context is not lost at boundaries; prefers splitting at
 * paragraphs and sentences so each chunk reads on its own.
 */

const CHARS_PER_TOKEN = 4;
/** Target chunk size in characters (~500 tokens). */
export const CHUNK_TARGET_CHARS = 2000; // ~500 tokens
/** Overlap carried between consecutive chunks (~80 tokens). */
export const CHUNK_OVERLAP_CHARS = 320; // ~80 tokens

/** One chunk of document text ready to embed. */
export interface TextChunk {
  index: number;
  content: string;
  tokenCount: number;
}

/** Splits raw text into overlapping chunks sized for embedding. */
export function chunkText(rawText: string): TextChunk[] {
  const text = rawText.replace(/\r\n/g, '\n').trim();
  if (text.length === 0) return [];

  // 1. Pieces that never exceed the target size: paragraphs, and when a
  //    paragraph is too long, its sentences (hard-split as last resort).
  const pieces = splitIntoPieces(text);

  // 2. Greedy grouping of pieces up to the target, carrying the tail of
  //    the previous chunk as overlap.
  const chunks: TextChunk[] = [];
  let current = '';

  const push = () => {
    const content = current.trim();
    if (content.length > 0) {
      chunks.push({
        index: chunks.length,
        content,
        tokenCount: Math.ceil(content.length / CHARS_PER_TOKEN),
      });
    }
  };

  for (const piece of pieces) {
    if (current.length > 0 && current.length + piece.length + 1 > CHUNK_TARGET_CHARS) {
      push();
      current = overlapTail(current);
    }
    current = current.length > 0 ? `${current}\n${piece}` : piece;
  }
  push();

  return chunks;
}

function splitIntoPieces(text: string): string[] {
  const pieces: string[] = [];
  for (const paragraph of text.split(/\n{2,}/)) {
    const trimmed = paragraph.trim();
    if (trimmed.length === 0) continue;
    if (trimmed.length <= CHUNK_TARGET_CHARS) {
      pieces.push(trimmed);
      continue;
    }
    // Paragraph longer than a chunk: split by sentences.
    for (const sentence of trimmed.split(/(?<=[.!?])\s+/)) {
      if (sentence.length <= CHUNK_TARGET_CHARS) {
        if (sentence.length > 0) pieces.push(sentence);
        continue;
      }
      // Giant sentence (unpunctuated text): hard-split.
      for (let i = 0; i < sentence.length; i += CHUNK_TARGET_CHARS) {
        pieces.push(sentence.slice(i, i + CHUNK_TARGET_CHARS));
      }
    }
  }
  return pieces;
}

/** Tail of the previous chunk used as overlap, cut at a word boundary. */
function overlapTail(chunk: string): string {
  if (chunk.length <= CHUNK_OVERLAP_CHARS) return chunk;
  const tail = chunk.slice(-CHUNK_OVERLAP_CHARS);
  const firstSpace = tail.indexOf(' ');
  return firstSpace === -1 ? tail : tail.slice(firstSpace + 1);
}
