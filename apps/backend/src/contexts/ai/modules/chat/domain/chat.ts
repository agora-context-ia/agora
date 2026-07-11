/**
 * Chat over a space's documentation. The "mode" is the task type (general
 * question, summary, etc.) and selects the instruction template; the
 * "model" is the concrete provider model configured by the organization
 * (see identity/ai-credentials).
 */

export const CHAT_MODES = [
  'general',
  'explain-process',
  'design-requirement',
  'summary',
  'explain-rules',
  'detect-contradictions',
  'acceptance-criteria',
] as const;

export type ChatMode = (typeof CHAT_MODES)[number];

/** Type guard narrowing an arbitrary string to a supported {@link ChatMode}. */
export function isChatMode(value: string): value is ChatMode {
  return (CHAT_MODES as readonly string[]).includes(value);
}

export type ChatRole = 'user' | 'assistant';

/** A documentation fragment that grounded an answer, as shown to the user. */
export interface ChatSource {
  documentName: string;
  fragment: string;
  relevance: number;
}

/** A persisted chat message within a conversation. */
export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: Date;
}

/** Thrown when the requesting user does not belong to the organization. */
export class NotOrganizationMemberError extends Error {
  constructor() {
    super('No sos miembro de esta organización');
    this.name = 'NotOrganizationMemberError';
  }
}

/** Thrown when the space does not exist or belongs to another organization. */
export class SpaceNotFoundInOrganizationError extends Error {
  constructor() {
    super('El espacio no existe en esta organización');
    this.name = 'SpaceNotFoundInOrganizationError';
  }
}

/** Thrown when neither the organization nor the environment provides an API key. */
export class AiProviderNotConfiguredError extends Error {
  constructor() {
    super(
      'La organización no tiene un proveedor de IA configurado. Un admin puede cargarlo en Configuración → Modelos IA.',
    );
    this.name = 'AiProviderNotConfiguredError';
  }
}

/** Thrown when the requested model is not part of the provider catalog. */
export class UnknownChatModelError extends Error {
  constructor(model: string) {
    super(`Modelo de IA desconocido: ${model}`);
    this.name = 'UnknownChatModelError';
  }
}

/** Thrown when the LLM provider returns an error response. */
export class LlmRequestFailedError extends Error {
  constructor(detail: string) {
    super(`El proveedor de IA respondió con un error: ${detail}`);
    this.name = 'LlmRequestFailedError';
  }
}
