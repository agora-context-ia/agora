export type OrganizationMemberRole = 'owner' | 'admin' | 'member';

export interface OrganizationRolePort {
  // null: no es miembro activo de la organización.
  getRole(userId: string, organizationId: string): Promise<OrganizationMemberRole | null>;
}
