import { slugify } from '../../../../../../shared/slugify';
import {
  NotOrganizationMemberError,
  SpaceSlugTakenError,
  type Space,
} from '../../domain/space';
import type { OrganizationMembershipPort } from '../../ports/organization-membership.port';
import type { SpaceRepositoryPort } from '../../ports/space-repository.port';

/** Creator, organization and display data for the new space. */
export interface CreateSpaceInput {
  userId: string;
  organizationId: string;
  name: string;
  description?: string;
}

/** Creates a space in the organization; the slug derives from the name. */
export class CreateSpaceUseCase {
  constructor(
    private readonly spaces: SpaceRepositoryPort,
    private readonly membership: OrganizationMembershipPort,
  ) {}

  async execute(input: CreateSpaceInput): Promise<Space> {
    const isMember = await this.membership.isMember(input.userId, input.organizationId);
    if (!isMember) throw new NotOrganizationMemberError();

    const slug = slugify(input.name) || 'espacio';
    if (await this.spaces.slugExists(input.organizationId, slug)) {
      throw new SpaceSlugTakenError(slug);
    }

    return this.spaces.create({
      organizationId: input.organizationId,
      createdBy: input.userId,
      name: input.name,
      slug,
      description: input.description?.trim() ? input.description.trim() : null,
    });
  }
}
