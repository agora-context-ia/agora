import { Prisma } from '@prisma/client';
import { prisma } from '../../../../../infrastructure/persistence/prisma-client';
import type {
  ChunkWithEmbedding,
  EmbeddingRepositoryPort,
  SemanticSearchHit,
} from '../ports/embedding-repository.port';

const INSERT_BATCH_SIZE = 200;

/**
 * Embedding store on pgvector. Prisma's DSL does not support the vector
 * type, so embedding inserts/queries use raw SQL casting the literal
 * '[0.1,0.2,...]'::vector.
 */
export class PrismaEmbeddingRepository implements EmbeddingRepositoryPort {
  async replaceForSource(
    sourceId: string,
    spaceId: string,
    chunks: ChunkWithEmbedding[],
    modelName: string,
  ): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await deleteDerivedData(tx, sourceId);

      const created = await tx.contextChunk.createManyAndReturn({
        data: chunks.map((chunk) => ({
          sourceId,
          spaceId,
          chunkIndex: chunk.chunkIndex,
          content: chunk.content,
          tokenCount: chunk.tokenCount,
        })),
        select: { id: true, chunkIndex: true },
      });
      const chunkIdByIndex = new Map(created.map((row) => [row.chunkIndex, row.id]));

      for (let i = 0; i < chunks.length; i += INSERT_BATCH_SIZE) {
        const batch = chunks.slice(i, i + INSERT_BATCH_SIZE);
        const values = Prisma.join(
          batch.map((chunk) => {
            const chunkId = chunkIdByIndex.get(chunk.chunkIndex);
            return Prisma.sql`(${chunkId}::uuid, ${spaceId}::uuid, ${toVectorLiteral(
              chunk.embedding,
            )}::vector, ${modelName})`;
          }),
        );
        await tx.$executeRaw(
          Prisma.sql`INSERT INTO ai.embeddings (chunk_id, space_id, embedding, model_name) VALUES ${values}`,
        );
      }
    });
  }

  async deleteForSource(sourceId: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await deleteDerivedData(tx, sourceId);
    });
  }

  async search(
    spaceId: string,
    queryEmbedding: number[],
    modelName: string,
    limit: number,
  ): Promise<SemanticSearchHit[]> {
    const vector = toVectorLiteral(queryEmbedding);
    const rows = await prisma.$queryRaw<
      Array<{
        document_id: string;
        file_name: string;
        chunk_index: number;
        content: string;
        score: number;
      }>
    >(Prisma.sql`
      SELECT d.id AS document_id,
             d.file_name,
             c.chunk_index,
             c.content,
             1 - (e.embedding <=> ${vector}::vector) AS score
      FROM ai.embeddings e
      JOIN main.context_chunks c ON c.id = e.chunk_id
      JOIN main.context_documents d
        ON d.source_id = c.source_id AND d.deleted_at IS NULL
      WHERE e.space_id = ${spaceId}::uuid
        AND e.model_name = ${modelName}
        AND e.deleted_at IS NULL
        AND c.deleted_at IS NULL
      ORDER BY e.embedding <=> ${vector}::vector
      LIMIT ${limit}
    `);

    return rows.map((row) => ({
      documentId: row.document_id,
      fileName: row.file_name,
      chunkIndex: row.chunk_index,
      content: row.content,
      score: row.score,
    }));
  }
}

/**
 * Chunks/embeddings are data derived from the file: on reprocess or delete
 * they are hard-deleted (soft delete is reserved for business entities).
 */
async function deleteDerivedData(tx: Prisma.TransactionClient, sourceId: string): Promise<void> {
  await tx.$executeRaw(Prisma.sql`
    DELETE FROM ai.embeddings e
    USING main.context_chunks c
    WHERE e.chunk_id = c.id AND c.source_id = ${sourceId}::uuid
  `);
  await tx.contextChunk.deleteMany({ where: { sourceId } });
}

function toVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(',')}]`;
}
