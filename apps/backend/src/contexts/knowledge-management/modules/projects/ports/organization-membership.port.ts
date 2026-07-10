// Puerto hacia el contexto identity: los espacios necesitan saber si el
// usuario pertenece a la organización, sin acoplarse a sus modelos.
export interface OrganizationMembershipPort {
  isMember(userId: string, organizationId: string): Promise<boolean>;
}
