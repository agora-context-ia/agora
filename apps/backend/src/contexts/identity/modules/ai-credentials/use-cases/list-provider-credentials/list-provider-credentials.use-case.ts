import { AI_PROVIDERS, AI_PROVIDER_CATALOG } from '../../../../../../shared/ai-provider-catalog';
import { NotOrganizationMemberError, type ProviderSetting } from '../../domain/ai-provider-credential';
import type { AiCredentialRepositoryPort } from '../../ports/ai-credential-repository.port';
import type { OrganizationRolePort } from '../../ports/organization-role.port';

/**
 * Lists the AI provider settings of an organization.
 *
 * Any active member can read this (admin is not required). It returns ALL
 * supported providers with their model catalog, configured or not: the
 * frontend builds both the Settings section and the chat model selector
 * from this same list.
 */
export class ListProviderCredentialsUseCase {
  constructor(
    private readonly roles: OrganizationRolePort,
    private readonly credentials: AiCredentialRepositoryPort,
  ) {}

  /** @throws NotOrganizationMemberError when the user is not a member of the organization. */
  async execute(userId: string, organizationId: string): Promise<ProviderSetting[]> {
    const role = await this.roles.getRole(userId, organizationId);
    if (role === null) throw new NotOrganizationMemberError();

    const configured = await this.credentials.listByOrganization(organizationId);

    return AI_PROVIDERS.map((provider) => {
      const credential = configured.find((row) => row.provider === provider);
      return {
        provider,
        label: AI_PROVIDER_CATALOG[provider].label,
        models: AI_PROVIDER_CATALOG[provider].models,
        configured: credential !== undefined,
        apiKeyLastFour: credential?.apiKeyLastFour ?? null,
        updatedAt: credential?.updatedAt ?? null,
      };
    });
  }
}
