export interface Project {
  id: string;
  name: string;
}

export interface Document {
  id: string;
  projectId: string;
  name: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

// ---------------------------------------------------------------------
// Organizaciones
// ---------------------------------------------------------------------

export type OrganizationRoleDto = 'owner' | 'admin' | 'member';

export interface OrganizationDto {
  id: string;
  name: string;
  slug: string;
  role: OrganizationRoleDto;
}

export interface CreateOrganizationDto {
  name: string;
}

// ---------------------------------------------------------------------
// Espacios (proyectos dentro de una organización)
// ---------------------------------------------------------------------

export interface SpaceDto {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  description: string | null;
  documentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSpaceDto {
  name: string;
  description?: string;
}

// ---------------------------------------------------------------------
// Documentos (fuentes de contexto de un espacio)
// ---------------------------------------------------------------------

export type DocumentProcessingStatusDto = 'pending' | 'processing' | 'ready' | 'error';

export interface DocumentClassificationDto {
  code: string;
  name: string;
}

export interface DocumentDto {
  id: string;
  spaceId: string;
  fileName: string;
  mimeType: string | null;
  fileSizeBytes: number | null;
  processingStatus: DocumentProcessingStatusDto;
  processingError: string | null;
  classification: DocumentClassificationDto | null;
  createdAt: string;
  updatedAt: string;
}

export interface SemanticSearchHitDto {
  documentId: string;
  fileName: string;
  chunkIndex: number;
  content: string;
  score: number;
}

// ---------------------------------------------------------------------
// Catálogos (schema parameters). El code es el contrato estable.
// ---------------------------------------------------------------------

export interface CatalogItemDto {
  code: string;
  name: string;
  description: string | null;
  sortOrder: number;
}

// ---------------------------------------------------------------------
// Eventos realtime (SSE): señales de invalidación, nunca llevan datos.
// ---------------------------------------------------------------------

export interface DocumentUpdatedEventDto {
  type: 'document.updated';
  organizationId: string;
  spaceId: string;
  documentId: string;
  status: DocumentProcessingStatusDto;
}

export type RealtimeEventDto = DocumentUpdatedEventDto;
