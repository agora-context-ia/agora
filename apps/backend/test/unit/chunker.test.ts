import { describe, expect, it } from 'vitest';
import {
  CHUNK_OVERLAP_CHARS,
  CHUNK_TARGET_CHARS,
  chunkText,
} from '../../src/contexts/knowledge-management/modules/documents/domain/chunker';

describe('chunkText', () => {
  it('devuelve vacío para texto vacío o solo espacios', () => {
    expect(chunkText('')).toEqual([]);
    expect(chunkText('   \n\n  ')).toEqual([]);
  });

  it('un texto corto queda en un solo chunk con tokenCount estimado', () => {
    const chunks = chunkText('Hola mundo. Esto es una prueba.');
    expect(chunks).toHaveLength(1);
    expect(chunks[0].index).toBe(0);
    expect(chunks[0].tokenCount).toBe(Math.ceil(chunks[0].content.length / 4));
  });

  it('parte textos largos en chunks que respetan el tamaño objetivo', () => {
    const paragraph = 'Una oración de relleno para el test. ';
    const text = Array.from({ length: 40 }, () => paragraph.repeat(10)).join('\n\n');
    const chunks = chunkText(text);

    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      // margen: objetivo + solapamiento arrastrado del chunk anterior
      expect(chunk.content.length).toBeLessThanOrEqual(
        CHUNK_TARGET_CHARS + CHUNK_OVERLAP_CHARS + 1,
      );
    }
    expect(chunks.map((chunk) => chunk.index)).toEqual(chunks.map((_, i) => i));
  });

  it('solapa el final del chunk anterior con el siguiente', () => {
    const sentence = 'Contenido repetido para forzar el corte de chunks. ';
    const text = sentence.repeat(120); // ~6000 chars, sin párrafos
    const chunks = chunkText(text);

    expect(chunks.length).toBeGreaterThan(1);
    const tailOfFirst = chunks[0].content.slice(-40);
    expect(chunks[1].content).toContain(tailOfFirst.trim().slice(0, 20));
  });

  it('hace hard-split de una oración gigante sin puntuación', () => {
    const text = 'x'.repeat(CHUNK_TARGET_CHARS * 3);
    const chunks = chunkText(text);
    expect(chunks.length).toBeGreaterThanOrEqual(3);
  });
});
