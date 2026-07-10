import {
  OrganizationSlugTakenError,
  type OrganizationRole,
  type OrganizationWithRole,
} from '../../../src/contexts/identity/modules/organizations/domain/organization';
import type {
  CreateOrganizationData,
  OrganizationRepositoryPort,
} from '../../../src/contexts/identity/modules/organizations/ports/organization-repository.port';

interface StoredOrganization {
  id: string;
  name: string;
  slug: string;
}

interface StoredMember {
  organizationId: string;
  userId: string;
  role: OrganizationRole;
}

// Fake en memoria que replica el contrato del repositorio Prisma:
// listByMember filtra por membresía, createWithOwner crea org + owner.
export class FakeOrganizationRepository implements OrganizationRepositoryPort {
  readonly organizations: StoredOrganization[] = [];
  readonly members: StoredMember[] = [];
  private sequence = 1;

  seed(name: string, slug: string, ownerId: string): StoredOrganization {
    const organization = { id: `org-${this.sequence++}`, name, slug };
    this.organizations.push(organization);
    this.members.push({ organizationId: organization.id, userId: ownerId, role: 'owner' });
    return organization;
  }

  addMember(organizationId: string, userId: string, role: OrganizationRole = 'member'): void {
    this.members.push({ organizationId, userId, role });
  }

  async createWithOwner(data: CreateOrganizationData): Promise<OrganizationWithRole> {
    if (await this.slugExists(data.slug)) throw new OrganizationSlugTakenError(data.slug);
    const organization = this.seed(data.name, data.slug, data.createdBy);
    return { id: organization.id, name: organization.name, slug: organization.slug, role: 'owner' };
  }

  async listByMember(userId: string): Promise<OrganizationWithRole[]> {
    return this.members
      .filter((member) => member.userId === userId)
      .map((member) => {
        const organization = this.organizations.find((org) => org.id === member.organizationId)!;
        return {
          id: organization.id,
          name: organization.name,
          slug: organization.slug,
          role: member.role,
        };
      });
  }

  async slugExists(slug: string): Promise<boolean> {
    return this.organizations.some((organization) => organization.slug === slug);
  }
}
