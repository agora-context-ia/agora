import type { AiProvider, ProviderCredentialSummary } from '../domain/ai-provider-credential';

export interface UpsertCredentialData {
  organizationId: string;
  provider: AiProvider;
  apiKeyEncrypted: string;
  apiKeyLastFour: string;
  createdBy: string;
}

export interface AiCredentialRepositoryPort {
  upsert(data: UpsertCredentialData): Promise<ProviderCredentialSummary>;
  listByOrganization(organizationId: string): Promise<ProviderCredentialSummary[]>;
  // Solo para uso server-side (futuro adapter de LLM). La key descifrada
  // jamás debe pasar por una ruta HTTP.
  findEncryptedKey(organizationId: string, provider: AiProvider): Promise<string | null>;
}
