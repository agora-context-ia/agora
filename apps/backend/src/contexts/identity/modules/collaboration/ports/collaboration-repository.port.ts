import type { CollaborationRole, InvitableRole, OrganizationInvitation, OrganizationMember } from '../domain/collaboration';

export interface CreateInvitationData {
  organizationId: string;
  email: string;
  role: InvitableRole;
  invitedBy: string;
  tokenHash: string;
  expiresAt: Date;
}

/** Persistence contract for organization membership and invitations. */
export interface CollaborationRepositoryPort {
  findRole(userId: string, organizationId: string): Promise<CollaborationRole | null>;
  findUserEmail(userId: string): Promise<string | null>;
  listMembers(organizationId: string): Promise<OrganizationMember[]>;
  listPendingInvitations(organizationId: string): Promise<OrganizationInvitation[]>;
  createInvitation(data: CreateInvitationData): Promise<OrganizationInvitation>;
  acceptInvitation(tokenHash: string, userId: string, email: string): Promise<string>;
  revokeInvitation(invitationId: string, organizationId: string): Promise<boolean>;
}
