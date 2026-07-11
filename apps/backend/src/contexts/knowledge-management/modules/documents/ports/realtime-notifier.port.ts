import type { DocumentProcessingStatus } from '../domain/document';

/** Emitted whenever a document changes processing status. */
export interface DocumentUpdatedEvent {
  organizationId: string;
  spaceId: string;
  documentId: string;
  status: DocumentProcessingStatus;
}

/**
 * Invalidation signal towards the frontend (SSE): tells WHEN to re-fetch;
 * it never carries the data. Infra resolves which users to notify (active
 * members of the organization) and publishes via Redis pub/sub.
 */
export interface RealtimeNotifierPort {
  notifyDocumentUpdated(event: DocumentUpdatedEvent): Promise<void>;
}
