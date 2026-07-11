/**
 * Async processing queue: the upload enqueues and responds; a worker runs
 * ProcessDocumentUseCase outside the request.
 */
export interface DocumentProcessingQueuePort {
  enqueue(documentId: string): Promise<void>;
}
