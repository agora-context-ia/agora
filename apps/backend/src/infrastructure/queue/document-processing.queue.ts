import { Queue, Worker } from 'bullmq';
import type { DocumentProcessingQueuePort } from '../../contexts/knowledge-management/modules/documents/ports/document-processing-queue.port';
import type { ProcessDocumentUseCase } from '../../contexts/knowledge-management/modules/documents/use-cases/process-document/process-document.use-case';
import { createRedisConnection, redisConnection } from '../redis/redis-clients';

const QUEUE_NAME = 'document-processing';

/** BullMQ-backed implementation of the document processing queue port. */
export class BullMqDocumentProcessingQueue implements DocumentProcessingQueuePort {
  private readonly queue = new Queue(QUEUE_NAME, { connection: redisConnection });

  async enqueue(documentId: string): Promise<void> {
    await this.queue.add(
      'process',
      { documentId },
      {
        attempts: 3, // 1 attempt + 2 retries
        backoff: { type: 'exponential', delay: 3000 },
        removeOnComplete: true,
        removeOnFail: true,
      },
    );
  }
}

/**
 * Worker in the same process as the API for now; if volume grows it moves
 * to a separate process without touching the use case.
 */
export function startDocumentProcessingWorker(
  processDocument: ProcessDocumentUseCase,
): Worker {
  const worker = new Worker<{ documentId: string }>(
    QUEUE_NAME,
    async (job) => {
      await processDocument.execute(job.data.documentId);
    },
    { connection: createRedisConnection(), concurrency: 2 },
  );

  worker.on('failed', (job, error) => {
    console.error(
      `[document-processing] job ${job?.id} (doc ${job?.data.documentId}) falló:`,
      error.message,
    );
  });

  return worker;
}
