import { slugify } from '../../../../../../shared/slugify';
import type { OrganizationWithRole } from '../../domain/organization';
import type { OrganizationRepositoryPort } from '../../ports/organization-repository.port';

/** Creator id and display name; the slug is derived from the name. */
export interface CreateOrganizationInput {
  userId: string;
  name: string;
}

/**
 * Creates an organization and registers the creator as its owner.
 * The slug is derived from the name; collisions get an incremental
 * suffix (-2, -3, …) instead of failing.
 */
export class CreateOrganizationUseCase {
  constructor(private readonly organizations: OrganizationRepositoryPort) {}

  async execute(input: CreateOrganizationInput): Promise<OrganizationWithRole> {
    const baseSlug = slugify(input.name) || 'org';

    let slug = baseSlug;
    let attempt = 2;
    while (await this.organizations.slugExists(slug)) {
      slug = `${baseSlug}-${attempt}`;
      attempt += 1;
    }

    return this.organizations.createWithOwner({
      name: input.name,
      slug,
      createdBy: input.userId,
    });
  }
}
