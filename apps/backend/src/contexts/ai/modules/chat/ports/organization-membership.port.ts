/**
 * Chat-owned view of organization membership. Mirrors the identity data
 * the chat module needs without importing another context: the container
 * wires it to an existing adapter that satisfies this shape.
 */
export interface OrganizationMembershipPort {
  isMember(userId: string, organizationId: string): Promise<boolean>;
}
