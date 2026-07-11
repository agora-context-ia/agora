import type { Space } from '../domain/space';

/** Data to persist a new space. */
export interface CreateSpaceData {
  organizationId: string;
  createdBy: string;
  name: string;
  slug: string;
  description: string | null;
}

/** Persistence contract for spaces. */
export interface SpaceRepositoryPort {
  listByOrganization(organizationId: string): Promise<Space[]>;
  /** @throws SpaceSlugTakenError when the slug already exists in the organization. */
  create(data: CreateSpaceData): Promise<Space>;
  slugExists(organizationId: string, slug: string): Promise<boolean>;
}
