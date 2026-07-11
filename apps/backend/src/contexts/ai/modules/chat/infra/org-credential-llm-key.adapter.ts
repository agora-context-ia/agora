import type { AiCredentialRepositoryPort } from '../../../../identity/modules/ai-credentials/ports/ai-credential-repository.port';
import type { CredentialCipherPort } from '../../../../identity/modules/ai-credentials/ports/credential-cipher.port';
import type { AiProvider } from '../../../../../shared/ai-provider-catalog';
import type { LlmCredentialPort } from '../ports/llm-credential.port';

/**
 * Anti-corruption adapter resolving the provider API key for an
 * organization: first the org's own key (encrypted at rest), then the
 * local-development fallback (e.g. the backend's GEMINI_API_KEY env var).
 *
 * Composes identity/ai-credentials ports, which is allowed only here in
 * `infra/` (see AGENTS.md dependency rules). The decrypted key never
 * leaves this process.
 */
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
