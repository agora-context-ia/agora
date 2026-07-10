import type { Space } from '../domain/space';

export interface CreateSpaceData {
  organizationId: string;
  createdBy: string;
  name: string;
  slug: string;
  description: string | null;
}

export interface SpaceRepositoryPort {
  listByOrganization(organizationId: string): Promise<Space[]>;
  // Lanza SpaceSlugTakenError si el slug ya existe en la organización.
  create(data: CreateSpaceData): Promise<Space>;
  slugExists(organizationId: string, slug: string): Promise<boolean>;
}
