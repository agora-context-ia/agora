export type MemberRole = 'owner' | 'admin' | 'member';

export interface OrganizationMember {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  role: MemberRole;
  joinedAt: string | null;
}

export interface OrganizationInvitation {
  id: string;
  email: string;
  role: Exclude<MemberRole, 'owner'>;
  expiresAt: string;
}
