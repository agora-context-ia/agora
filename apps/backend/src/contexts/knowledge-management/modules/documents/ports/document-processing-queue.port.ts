// Cola de procesamiento async: el upload encola y responde; un worker
// ejecuta ProcessDocumentUseCase por fuera del request.
export interface DocumentProcessingQueuePort {
  enqueue(documentId: string): Promise<void>;
}
