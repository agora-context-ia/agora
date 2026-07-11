import {
  AI_PROVIDERS,
  AI_PROVIDER_CATALOG,
  NotOrganizationMemberError,
  type ProviderSetting,
} from '../../domain/ai-provider-credential';
import type { AiCredentialRepositoryPort } from '../../ports/ai-credential-repository.port';
import type { OrganizationRolePort } from '../../ports/organization-role.port';

// Cualquier miembro activo puede ver qué proveedores están configurados
// (no hace falta ser admin). Devuelve TODOS los proveedores soportados
// con su catálogo de modelos, configurados o no: el frontend arma tanto
// la sección de Settings como el selector del chat con esta misma lista.
export class ListProviderCredentialsUseCase {
  constructor(
    private readonly roles: OrganizationRolePort,
    private readonly credentials: AiCredentialRepositoryPort,
  ) {}

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
