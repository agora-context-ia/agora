export type OrganizationRole = 'owner' | 'admin' | 'member';

// Organización vista desde el usuario autenticado: incluye el rol que
// tiene en ella (viene de organization_members).
export interface OrganizationWithRole {
  id: string;
  name: string;
  slug: string;
  role: OrganizationRole;
}

export class OrganizationSlugTakenError extends Error {
  constructor(slug: string) {
    super(`El slug de organización "${slug}" ya está en uso`);
    this.name = 'OrganizationSlugTakenError';
  }
}
