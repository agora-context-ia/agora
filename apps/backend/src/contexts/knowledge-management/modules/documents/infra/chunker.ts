// Chunking por caracteres aproximando tokens (~4 chars/token, heurística
// razonable para es/en). Objetivo ~500 tokens con solapamiento ~80 para no
// perder contexto en los bordes; corta preferentemente en párrafos y
// oraciones para que cada chunk sea legible por sí solo.

const CHARS_PER_TOKEN = 4;
export const CHUNK_TARGET_CHARS = 2000; // ~500 tokens
export const CHUNK_OVERLAP_CHARS = 320; // ~80 tokens

export interface TextChunk {
  index: number;
  content: string;
  tokenCount: number;
}

export function chunkText(rawText: string): TextChunk[] {
  const text = rawText.replace(/\r\n/g, '\n').trim();
  if (text.length === 0) return [];

  // 1. Piezas que nunca superan el tamaño objetivo: párrafos, y si un
  //    párrafo se pasa, sus oraciones (hard-split como último recurso).
  const pieces = splitIntoPieces(text);

  // 2. Agrupado greedy de piezas hasta el objetivo, arrastrando la cola
  //    del chunk anterior como solapamiento.
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
    // Párrafo más largo que un chunk: separar por oraciones.
    for (const sentence of trimmed.split(/(?<=[.!?])\s+/)) {
      if (sentence.length <= CHUNK_TARGET_CHARS) {
        if (sentence.length > 0) pieces.push(sentence);
        continue;
      }
      // Oración gigante (texto sin puntuación): hard-split.
      for (let i = 0; i < sentence.length; i += CHUNK_TARGET_CHARS) {
        pieces.push(sentence.slice(i, i + CHUNK_TARGET_CHARS));
      }
    }
  }
  return pieces;
}

// Cola del chunk anterior para solapar, cortada en límite de palabra.
function overlapTail(chunk: string): string {
  if (chunk.length <= CHUNK_OVERLAP_CHARS) return chunk;
  const tail = chunk.slice(-CHUNK_OVERLAP_CHARS);
  const firstSpace = tail.indexOf(' ');
  return firstSpace === -1 ? tail : tail.slice(firstSpace + 1);
}
