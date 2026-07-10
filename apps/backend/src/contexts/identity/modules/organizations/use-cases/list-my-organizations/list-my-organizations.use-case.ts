import type { OrganizationWithRole } from '../../domain/organization';
import type { OrganizationRepositoryPort } from '../../ports/organization-repository.port';

// Devuelve únicamente las organizaciones donde el usuario es member
// activo — nunca todas las de la tabla.
export class ListMyOrganizationsUseCase {
  constructor(private readonly organizations: OrganizationRepositoryPort) {}

  execute(userId: string): Promise<OrganizationWithRole[]> {
    return this.organizations.listByMember(userId);
  }
}
