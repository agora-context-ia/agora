/** Role of the current user inside an organization. */
export type OrganizationRole = 'owner' | 'admin' | 'member';

/** An organization the user belongs to, with their role in it. */
export interface Organization {
  id: string;
  name: string;
  slug: string;
  role: OrganizationRole;
}
