/**
 * Port towards the identity context: spaces need to know whether the user
 * belongs to the organization, without coupling to its models.
 */
export interface OrganizationMembershipPort {
  isMember(userId: string, organizationId: string): Promise<boolean>;
}
