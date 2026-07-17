import type { OrganizationInvitation, OrganizationMember } from '../domain/collaboration';

export interface CollaborationSnapshot {
  members: OrganizationMember[];
  invitations: OrganizationInvitation[];
}

/** API operations for organization members and invitations. */
export interface CollaborationApiPort {
  get(organizationId: string): Promise<CollaborationSnapshot>;
  invite(organizationId: string, email: string, role: 'admin' | 'member'): Promise<{ invitation: OrganizationInvitation; invitationUrl: string }>;
  revoke(organizationId: string, invitationId: string): Promise<void>;
  accept(token: string): Promise<string>;
}
