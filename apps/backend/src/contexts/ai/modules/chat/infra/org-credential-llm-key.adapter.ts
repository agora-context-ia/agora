import type { AiProvider } from '../../../../identity/modules/ai-credentials/domain/ai-provider-credential';
import type { AiCredentialRepositoryPort } from '../../../../identity/modules/ai-credentials/ports/ai-credential-repository.port';
import type { CredentialCipherPort } from '../../../../identity/modules/ai-credentials/ports/credential-cipher.port';
import type { LlmCredentialPort } from '../ports/llm-credential.port';

// Resuelve la key del proveedor: primero la de la organización (cifrada
// en main.ai_provider_credentials), y si no hay, el fallback de
// desarrollo local (GEMINI_API_KEY del backend). La key descifrada nunca
// sale de este proceso.
export class OrgCredentialLlmKeyAdapter implements LlmCredentialPort {
  constructor(
    private readonly credentials: AiCredentialRepositoryPort,
    private readonly cipher: CredentialCipherPort,
    private readonly fallbackKeys: Partial<Record<string, string>> = {},
  ) {}

  async getApiKey(organizationId: string, provider: string): Promise<string | null> {
    const encrypted = await this.credentials.findEncryptedKey(
      organizationId,
      provider as AiProvider,
    );
    if (encrypted) return this.cipher.decrypt(encrypted);

    const fallback = this.fallbackKeys[provider];
    if (fallback && fallback !== 'CHANGE_ME') return fallback;

    return null;
  }
}
