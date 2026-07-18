import { createHash, randomBytes } from 'node:crypto';
import {
  InsufficientOrganizationRoleError,
  InvitationConflictError,
  InvitationEmailMismatchError,
  InvitationNotFoundError,
  NotOrganizationMemberError,
  type InvitableRole,
} from '../../domain/collaboration';
import type { CollaborationRepositoryPort } from '../../ports/collaboration-repository.port';

const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** Provides the authenticated collaboration operations for one organization. */
export class ManageCollaborationUseCase {
  constructor(private readonly repository: CollaborationRepositoryPort) {}

  async list(userId: string, organizationId: string) {
    await this.requireMember(userId, organizationId);
    const [members, invitations] = await Promise.all([
      this.repository.listMembers(organizationId),
      this.repository.listPendingInvitations(organizationId),
    ]);
    return { members, invitations };
  }

  async invite(input: { userId: string; organizationId: string; email: string; role: InvitableRole }) {
    await this.requireManager(input.userId, input.organizationId);
    const token = randomBytes(32).toString('base64url');
    try {
      const invitation = await this.repository.createInvitation({
        organizationId: input.organizationId,
        email: normalizeEmail(input.email),
        role: input.role,
        invitedBy: input.userId,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + INVITATION_TTL_MS),
      });
      return { invitation, token };
    } catch (error) {
      if (isUniqueViolation(error)) throw new InvitationConflictError();
      throw error;
    }
  }

  async accept(userId: string, token: string): Promise<string> {
    const email = await this.repository.findUserEmail(userId);
    if (!email) throw new InvitationEmailMismatchError();
    try {
      return await this.repository.acceptInvitation(hashToken(token), userId, normalizeEmail(email));
    } catch (error) {
      if (error instanceof InvitationEmailMismatchError || error instanceof InvitationConflictError) throw error;
      throw new InvitationNotFoundError();
    }
  }

  async revoke(userId: string, organizationId: string, invitationId: string): Promise<void> {
    await this.requireManager(userId, organizationId);
    if (!(await this.repository.revokeInvitation(invitationId, organizationId))) {
      throw new InvitationNotFoundError();
    }
  }

  private async requireMember(userId: string, organizationId: string) {
    const role = await this.repository.findRole(userId, organizationId);
    if (!role) throw new NotOrganizationMemberError();
    return role;
  }

  private async requireManager(userId: string, organizationId: string): Promise<void> {
    const role = await this.requireMember(userId, organizationId);
    if (role !== 'owner' && role !== 'admin') throw new InsufficientOrganizationRoleError();
  }
}

function normalizeEmail(email: string): string { return email.trim().toLowerCase(); }
function hashToken(token: string): string { return createHash('sha256').update(token).digest('hex'); }
function isUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === 'P2002';
}
