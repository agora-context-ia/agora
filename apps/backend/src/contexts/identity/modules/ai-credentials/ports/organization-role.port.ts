export type OrganizationMemberRole = 'owner' | 'admin' | 'member';

/** Resolves the role a user holds in an organization. */
export interface OrganizationRolePort {
  /** Returns null when the user is not an active member of the organization. */
  getRole(userId: string, organizationId: string): Promise<OrganizationMemberRole | null>;
}
