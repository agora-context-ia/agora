import type { OrganizationWithRole } from '../domain/organization';

export interface CreateOrganizationData {
  name: string;
  slug: string;
  createdBy: string;
}

export interface OrganizationRepositoryPort {
  // Crea la organización y su member 'owner' en una sola transacción.
  // Lanza OrganizationSlugTakenError si el slug ya existe.
  createWithOwner(data: CreateOrganizationData): Promise<OrganizationWithRole>;
  // Solo las organizaciones donde el usuario es member activo.
  listByMember(userId: string): Promise<OrganizationWithRole[]>;
  slugExists(slug: string): Promise<boolean>;
}
