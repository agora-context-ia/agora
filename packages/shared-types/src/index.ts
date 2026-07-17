// HTTP contract DTOs shared between backend and frontend. Data shapes
// only — no logic. A backend response change updates this file and the
// frontend adapter mapping in the same PR (see AGENTS.md).

// ---------------------------------------------------------------------
// Organizations
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

/** A user with active access to an organization. */
export interface OrganizationMemberDto {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  role: OrganizationRoleDto;
  joinedAt: string | null;
}

/** A pending invitation; its secret token is never returned after creation. */
export interface OrganizationInvitationDto {
  id: string;
  organizationId: string;
  email: string;
  role: Exclude<OrganizationRoleDto, 'owner'>;
  expiresAt: string;
  createdAt: string;
}

export interface CreateOrganizationInvitationDto {
  email: string;
  role: Exclude<OrganizationRoleDto, 'owner'>;
}

/** Creation result includes the one-time invitation URL to share with the recipient. */
export interface CreateOrganizationInvitationResponseDto {
  invitation: OrganizationInvitationDto;
  invitationUrl: string;
}

// ---------------------------------------------------------------------
// Spaces (projects inside an organization)
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
// Documents (context sources of a space)
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
// Per-organization AI configuration. The API key never travels complete
// to the frontend: only apiKeyLastFour.
// ---------------------------------------------------------------------

export type AiProviderDto = 'gemini' | 'openai' | 'anthropic' | 'ollama';

export interface AiModelOptionDto {
  value: string;
  label: string;
}

export interface AiProviderSettingDto {
  provider: AiProviderDto;
  label: string;
  /** false for self-hosted providers (e.g. Ollama): no key to configure. */
  requiresApiKey: boolean;
  models: AiModelOptionDto[];
  configured: boolean;
  apiKeyLastFour: string | null;
  updatedAt: string | null;
}

export interface SaveAiProviderKeyDto {
  apiKey: string;
}

// ---------------------------------------------------------------------
// Chat over a space's documentation
// ---------------------------------------------------------------------

export type ChatRoleDto = 'user' | 'assistant';

/**
 * One chat thread of a user inside a space. `title` is null until the
 * first user message names it.
 */
export interface ConversationDto {
  id: string;
  spaceId: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChatSourceDto {
  documentName: string;
  fragment: string;
  relevance: number;
}

export interface ChatMessageDto {
  id: string;
  role: ChatRoleDto;
  content: string;
  createdAt: string;
  /** Sources that grounded an assistant reply; absent on user messages. */
  sources?: ChatSourceDto[];
}

export interface SendChatMessageDto {
  content: string;
  mode: string;
  model: string | null;
}

export interface SendChatMessageResponseDto {
  conversationId: string;
  message: ChatMessageDto;
  sources: ChatSourceDto[];
}

// ---------------------------------------------------------------------
// User profile
// ---------------------------------------------------------------------

export interface UpdateProfileDto {
  fullName: string;
}

// ---------------------------------------------------------------------
// Catalogs (parameters schema). The code is the stable contract.
// ---------------------------------------------------------------------

export interface CatalogItemDto {
  code: string;
  name: string;
  description: string | null;
  sortOrder: number;
}

// ---------------------------------------------------------------------
// Realtime events (SSE): invalidation signals, they never carry data.
// ---------------------------------------------------------------------

export interface DocumentUpdatedEventDto {
  type: 'document.updated';
  organizationId: string;
  spaceId: string;
  documentId: string;
  status: DocumentProcessingStatusDto;
}

/**
 * A conversation of the receiving user changed (created, renamed or got
 * new messages). Sent only to the owner; the UI refetches the
 * conversation list and, if loaded, that conversation's messages.
 */
export interface ConversationUpdatedEventDto {
  type: 'conversation.updated';
  organizationId: string;
  spaceId: string;
  conversationId: string;
}

export type RealtimeEventDto = DocumentUpdatedEventDto | ConversationUpdatedEventDto;
