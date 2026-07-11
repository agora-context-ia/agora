import { isAiProvider } from '../../../../../../shared/ai-provider-catalog';
import {
  InvalidApiKeyError,
  NotOrganizationAdminError,
  NotOrganizationMemberError,
  UnknownAiProviderError,
  type ProviderCredentialSummary,
} from '../../domain/ai-provider-credential';
import type { AiCredentialRepositoryPort } from '../../ports/ai-credential-repository.port';
import type { CredentialCipherPort } from '../../ports/credential-cipher.port';
import type { OrganizationRolePort } from '../../ports/organization-role.port';

/** Request to store an API key; `provider` is validated against the catalog. */
export interface SaveProviderCredentialInput {
  userId: string;
  organizationId: string;
  provider: string;
  apiKey: string;
}

const API_KEY_MIN_LENGTH = 8;

/**
 * Stores (or replaces) an organization's API key for an AI provider.
 *
 * Only owners/admins may call it. The key is encrypted before persisting
 * and only its last four characters are ever returned.
 */
export class SaveProviderCredentialUseCase {
  constructor(
    private readonly roles: OrganizationRolePort,
    private readonly credentials: AiCredentialRepositoryPort,
    private readonly cipher: CredentialCipherPort,
  ) {}

  /**
   * @throws UnknownAiProviderError when the provider is not in the catalog.
   * @throws InvalidApiKeyError when the key fails basic shape validation.
   * @throws NotOrganizationMemberError when the user is not a member.
   * @throws NotOrganizationAdminError when the member is not owner/admin.
   */
  async execute(input: SaveProviderCredentialInput): Promise<ProviderCredentialSummary> {
    if (!isAiProvider(input.provider)) {
      throw new UnknownAiProviderError(input.provider);
    }

    const apiKey = input.apiKey.trim();
    if (apiKey.length < API_KEY_MIN_LENGTH) {
      throw new InvalidApiKeyError();
    }

    const role = await this.roles.getRole(input.userId, input.organizationId);
    if (role === null) throw new NotOrganizationMemberError();
    if (role !== 'owner' && role !== 'admin') throw new NotOrganizationAdminError();

    return this.credentials.upsert({
      organizationId: input.organizationId,
      provider: input.provider,
      apiKeyEncrypted: this.cipher.encrypt(apiKey),
      apiKeyLastFour: apiKey.slice(-4),
      createdBy: input.userId,
    });
  }
}
