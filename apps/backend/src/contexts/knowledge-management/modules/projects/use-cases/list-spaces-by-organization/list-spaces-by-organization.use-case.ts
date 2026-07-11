import { NotOrganizationMemberError, type Space } from '../../domain/space';
import type { OrganizationMembershipPort } from '../../ports/organization-membership.port';
import type { SpaceRepositoryPort } from '../../ports/space-repository.port';

/**
 * Inside an organization there are no spaces private between members:
 * if the user is a member, they see every space of the org.
 */
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
