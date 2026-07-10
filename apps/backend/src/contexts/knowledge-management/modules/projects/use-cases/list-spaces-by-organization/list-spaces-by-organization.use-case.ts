import { NotOrganizationMemberError, type Space } from '../../domain/space';
import type { OrganizationMembershipPort } from '../../ports/organization-membership.port';
import type { SpaceRepositoryPort } from '../../ports/space-repository.port';

// Dentro de una organización no hay espacios privados entre miembros:
// si el usuario es member, ve todos los espacios de la org.
export class ListSpacesByOrganizationUseCase {
  constructor(
    private readonly spaces: SpaceRepositoryPort,
    private readonly membership: OrganizationMembershipPort,
  ) {}

  async execute(userId: string, organizationId: string): Promise<Space[]> {
    const isMember = await this.membership.isMember(userId, organizationId);
    if (!isMember) throw new NotOrganizationMemberError();

    return this.spaces.listByOrganization(organizationId);
  }
}
