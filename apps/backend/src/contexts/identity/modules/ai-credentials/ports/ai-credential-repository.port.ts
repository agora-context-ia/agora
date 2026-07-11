import type { AiProvider } from '../../../../../shared/ai-provider-catalog';
import type { ProviderCredentialSummary } from '../domain/ai-provider-credential';

/** Payload to create or replace an organization's provider credential. */
export interface UpsertCredentialData {
  organizationId: string;
  provider: AiProvider;
  apiKeyEncrypted: string;
  apiKeyLastFour: string;
  createdBy: string;
}

/** Persistence contract for encrypted AI provider credentials. */
export interface AiCredentialRepositoryPort {
  upsert(data: UpsertCredentialData): Promise<ProviderCredentialSummary>;
  listByOrganization(organizationId: string): Promise<ProviderCredentialSummary[]>;
  /**
   * Server-side only (LLM adapters). The decrypted key must never pass
   * through an HTTP route.
   */
  findEncryptedKey(organizationId: string, provider: AiProvider): Promise<string | null>;
}
