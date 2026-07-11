import {
  InvalidApiKeyError,
  NotOrganizationAdminError,
  NotOrganizationMemberError,
  UnknownAiProviderError,
  isAiProvider,
  type ProviderCredentialSummary,
} from '../../domain/ai-provider-credential';
import type { AiCredentialRepositoryPort } from '../../ports/ai-credential-repository.port';
import type { CredentialCipherPort } from '../../ports/credential-cipher.port';
import type { OrganizationRolePort } from '../../ports/organization-role.port';

export interface SaveProviderCredentialInput {
  userId: string;
  organizationId: string;
  provider: string;
  apiKey: string;
}

const API_KEY_MIN_LENGTH = 8;

export class SaveProviderCredentialUseCase {
  constructor(
    private readonly roles: OrganizationRolePort,
    private readonly credentials: AiCredentialRepositoryPort,
    private readonly cipher: CredentialCipherPort,
  ) {}

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
