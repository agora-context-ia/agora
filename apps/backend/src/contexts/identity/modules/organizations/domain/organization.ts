export type OrganizationRole = 'owner' | 'admin' | 'member';

/**
 * Organization as seen by the authenticated user: includes the role they
 * hold in it (sourced from organization_members).
 */
export interface OrganizationWithRole {
  id: string;
  name: string;
  slug: string;
  role: OrganizationRole;
}

/** Thrown when an organization slug is already in use. */
export class OrganizationSlugTakenError extends Error {
  constructor(slug: string) {
    super(`El slug de organización "${slug}" ya está en uso`);
    this.name = 'OrganizationSlugTakenError';
  }
}
