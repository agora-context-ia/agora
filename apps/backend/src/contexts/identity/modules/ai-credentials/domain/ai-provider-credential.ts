/**
 * Organization-level AI provider credentials. An owner/admin stores the
 * API key and the whole team uses it. The encrypted key never leaves the
 * server over HTTP: only `apiKeyLastFour` travels to the client.
 *
 * The provider/model catalog itself lives in the shared kernel
 * (`shared/ai-provider-catalog`) because the `ai/chat` module also needs it.
 */
import type { AiProvider } from '../../../../../shared/ai-provider-catalog';

/** Outward-facing summary of a stored credential: never includes the key (even encrypted). */
export interface ProviderCredentialSummary {
  provider: AiProvider;
  apiKeyLastFour: string;
  updatedAt: Date;
}

/**
 * State of a supported provider, configured or not. Feeds both the
 * Settings section and the chat model selector.
 */
export interface ProviderSetting {
  provider: AiProvider;
  label: string;
  models: Array<{ value: string; label: string }>;
  configured: boolean;
  apiKeyLastFour: string | null;
  updatedAt: Date | null;
}

/** Thrown when the requesting user does not belong to the organization. */
export class NotOrganizationMemberError extends Error {
  constructor() {
    super('No sos miembro de esta organización');
    this.name = 'NotOrganizationMemberError';
  }
}

/** Thrown when a non owner/admin member tries to manage credentials. */
export class NotOrganizationAdminError extends Error {
  constructor() {
    super('Solo un owner o admin de la organización puede configurar esto');
    this.name = 'NotOrganizationAdminError';
  }
}

/** Thrown when the requested provider is not part of the supported catalog. */
export class UnknownAiProviderError extends Error {
  constructor(provider: string) {
    super(`Proveedor de IA desconocido: ${provider}`);
    this.name = 'UnknownAiProviderError';
  }
}

/** Thrown when the submitted API key fails basic shape validation. */
export class InvalidApiKeyError extends Error {
  constructor() {
    super('La API key no parece válida');
    this.name = 'InvalidApiKeyError';
  }
}
