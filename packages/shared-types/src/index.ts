export interface Project {
  id: string;
  name: string;
}

export interface Document {
  id: string;
  projectId: string;
  name: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

// ---------------------------------------------------------------------
// Organizaciones
// ---------------------------------------------------------------------

export type OrganizationRoleDto = 'owner' | 'admin' | 'member';

export interface OrganizationDto {
  id: string;
  name: string;
  slug: string;
  role: OrganizationRoleDto;
}

export interface CreateOrganizationDto {
  name: string;
}

// ---------------------------------------------------------------------
// Espacios (proyectos dentro de una organización)
// ---------------------------------------------------------------------

export interface SpaceDto {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  description: string | null;
  documentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSpaceDto {
  name: string;
  description?: string;
}
