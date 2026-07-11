import type { OrganizationWithRole } from '../domain/organization';

/** Data to persist a new organization with its owner membership. */
export interface CreateOrganizationData {
  name: string;
  slug: string;
  createdBy: string;
}

/** Persistence contract for organizations and their memberships. */
export interface OrganizationRepositoryPort {
  /**
   * Creates the organization and its 'owner' membership in one transaction.
   * @throws OrganizationSlugTakenError when the slug already exists.
   */
  createWithOwner(data: CreateOrganizationData): Promise<OrganizationWithRole>;
  /** Only organizations where the user is an active member. */
  listByMember(userId: string): Promise<OrganizationWithRole[]>;
  slugExists(slug: string): Promise<boolean>;
}
