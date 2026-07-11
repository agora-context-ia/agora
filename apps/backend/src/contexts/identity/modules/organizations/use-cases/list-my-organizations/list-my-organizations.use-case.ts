import type { OrganizationWithRole } from '../../domain/organization';
import type { OrganizationRepositoryPort } from '../../ports/organization-repository.port';

/**
 * Returns only the organizations where the user is an active member —
 * never the whole table.
 */
export class ListMyOrganizationsUseCase {
  constructor(private readonly organizations: OrganizationRepositoryPort) {}

  execute(userId: string): Promise<OrganizationWithRole[]> {
    return this.organizations.listByMember(userId);
  }
}
