export type CollaborationRole = 'owner' | 'admin' | 'member';
export type InvitableRole = Exclude<CollaborationRole, 'owner'>;

/** An active organization member with the profile fields needed by administrators. */
export interface OrganizationMember {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  role: CollaborationRole;
  joinedAt: Date | null;
}

/** A pending, unexpired invitation. */
export interface OrganizationInvitation {
  id: string;
  organizationId: string;
  email: string;
  role: InvitableRole;
  expiresAt: Date;
  createdAt: Date;
}

export class NotOrganizationMemberError extends Error {
  constructor() { super('No perteneces a esta organización'); this.name = 'NotOrganizationMemberError'; }
}

export class InsufficientOrganizationRoleError extends Error {
  constructor() { super('No tienes permisos para administrar colaboradores'); this.name = 'InsufficientOrganizationRoleError'; }
}

export class InvitationConflictError extends Error {
  constructor(message = 'Ya existe una invitación pendiente o el usuario ya es miembro') { super(message); this.name = 'InvitationConflictError'; }
}

export class InvitationNotFoundError extends Error {
  constructor() { super('La invitación no existe, expiró o ya fue utilizada'); this.name = 'InvitationNotFoundError'; }
}

export class InvitationEmailMismatchError extends Error {
  constructor() { super('La invitación pertenece a otra dirección de correo'); this.name = 'InvitationEmailMismatchError'; }
}
