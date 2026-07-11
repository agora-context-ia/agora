// Chat sobre la documentación de un espacio. El "modo" es el tipo de
// tarea (consulta general, resumen, etc.) y define la plantilla de
// instrucciones; el "modelo" es el modelo concreto del proveedor que
// configuró la organización (ver identity/ai-credentials).

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

export function isChatMode(value: string): value is ChatMode {
  return (CHAT_MODES as readonly string[]).includes(value);
}

export type ChatRole = 'user' | 'assistant';

export interface ChatSource {
  documentName: string;
  fragment: string;
  relevance: number;
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: Date;
}

export class NotOrganizationMemberError extends Error {
  constructor() {
    super('No sos miembro de esta organización');
    this.name = 'NotOrganizationMemberError';
  }
}

export class SpaceNotFoundInOrganizationError extends Error {
  constructor() {
    super('El espacio no existe en esta organización');
    this.name = 'SpaceNotFoundInOrganizationError';
  }
}

export class AiProviderNotConfiguredError extends Error {
  constructor() {
    super(
      'La organización no tiene un proveedor de IA configurado. Un admin puede cargarlo en Configuración → Modelos IA.',
    );
    this.name = 'AiProviderNotConfiguredError';
  }
}

export class UnknownChatModelError extends Error {
  constructor(model: string) {
    super(`Modelo de IA desconocido: ${model}`);
    this.name = 'UnknownChatModelError';
  }
}

export class LlmRequestFailedError extends Error {
  constructor(detail: string) {
    super(`El proveedor de IA respondió con un error: ${detail}`);
    this.name = 'LlmRequestFailedError';
  }
}
