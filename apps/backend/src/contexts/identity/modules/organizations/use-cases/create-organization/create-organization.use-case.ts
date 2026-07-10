import { slugify } from '../../../../../../shared/slugify';
import type { OrganizationWithRole } from '../../domain/organization';
import type { OrganizationRepositoryPort } from '../../ports/organization-repository.port';

export interface CreateOrganizationInput {
  userId: string;
  name: string;
}

export class CreateOrganizationUseCase {
  constructor(private readonly organizations: OrganizationRepositoryPort) {}

  async execute(input: CreateOrganizationInput): Promise<OrganizationWithRole> {
    const baseSlug = slugify(input.name) || 'org';

    // Si el slug ya existe se agrega sufijo incremental (-2, -3, …).
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
