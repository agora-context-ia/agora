import { describe, expect, it } from 'vitest';
import {
  InsufficientOrganizationRoleError,
  InvitationEmailMismatchError,
  type CollaborationRole,
  type OrganizationInvitation,
  type OrganizationMember,
} from '../../src/contexts/identity/modules/collaboration/domain/collaboration';
import type { CollaborationRepositoryPort, CreateInvitationData } from '../../src/contexts/identity/modules/collaboration/ports/collaboration-repository.port';
import { ManageCollaborationUseCase } from '../../src/contexts/identity/modules/collaboration/use-cases/manage-collaboration/manage-collaboration.use-case';

class FakeCollaborationRepository implements CollaborationRepositoryPort {
  role: CollaborationRole | null = 'owner';
  email: string | null = 'guest@example.com';
  created: CreateInvitationData | null = null;
  accepted: { tokenHash: string; userId: string; email: string } | null = null;
  members: OrganizationMember[] = [];
  invitations: OrganizationInvitation[] = [];
  async findRole() { return this.role; }
  async findUserEmail() { return this.email; }
  async listMembers() { return this.members; }
  async listPendingInvitations() { return this.invitations; }
  async createInvitation(data: CreateInvitationData) {
    this.created = data;
    return { id: 'inv-1', organizationId: data.organizationId, email: data.email, role: data.role, expiresAt: data.expiresAt, createdAt: new Date() };
  }
  async acceptInvitation(tokenHash: string, userId: string, email: string) {
    this.accepted = { tokenHash, userId, email };
    return 'org-1';
  }
  async revokeInvitation() { return true; }
}

describe('ManageCollaborationUseCase', () => {
  it('creates a seven-day invitation and persists only the token hash', async () => {
    const repository = new FakeCollaborationRepository();
    const useCase = new ManageCollaborationUseCase(repository);
    const before = Date.now();
    const result = await useCase.invite({ userId: 'owner-1', organizationId: 'org-1', email: ' Guest@Example.com ', role: 'member' });

    expect(repository.created?.email).toBe('guest@example.com');
    expect(repository.created?.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(repository.created?.tokenHash).not.toContain(result.token);
    expect(repository.created!.expiresAt.getTime()).toBeGreaterThanOrEqual(before + 7 * 24 * 60 * 60 * 1000);
  });

  it('prevents regular members from inviting collaborators', async () => {
    const repository = new FakeCollaborationRepository(); repository.role = 'member';
    const useCase = new ManageCollaborationUseCase(repository);
    await expect(useCase.invite({ userId: 'member-1', organizationId: 'org-1', email: 'new@example.com', role: 'member' })).rejects.toBeInstanceOf(InsufficientOrganizationRoleError);
  });

  it('accepts using the authenticated user email and a hashed token', async () => {
    const repository = new FakeCollaborationRepository();
    const useCase = new ManageCollaborationUseCase(repository);
    await expect(useCase.accept('guest-1', 'a'.repeat(43))).resolves.toBe('org-1');
    expect(repository.accepted?.email).toBe('guest@example.com');
    expect(repository.accepted?.tokenHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('rejects acceptance when the authenticated account has no email', async () => {
    const repository = new FakeCollaborationRepository(); repository.email = null;
    const useCase = new ManageCollaborationUseCase(repository);
    await expect(useCase.accept('guest-1', 'token')).rejects.toBeInstanceOf(InvitationEmailMismatchError);
  });
});
