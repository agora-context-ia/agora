import type { DocumentProcessingStatus } from '../domain/document';

export interface DocumentUpdatedEvent {
  organizationId: string;
  spaceId: string;
  documentId: string;
  status: DocumentProcessingStatus;
}

// Señal de invalidación hacia el frontend (SSE): avisa CUÁNDO volver a hacer
// GET; nunca lleva los datos. La infra resuelve a qué usuarios notificar
// (miembros activos de la organización) y publica vía Redis pub/sub.
export interface RealtimeNotifierPort {
  notifyDocumentUpdated(event: DocumentUpdatedEvent): Promise<void>;
}
