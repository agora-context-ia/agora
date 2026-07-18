import { prisma } from '../../../../../infrastructure/persistence/prisma-client';
import {
  InvitationConflictError,
  InvitationEmailMismatchError,
  InvitationNotFoundError,
  type CollaborationRole,
  type InvitableRole,
  type OrganizationInvitation,
  type OrganizationMember,
} from '../domain/collaboration';
import type { CollaborationRepositoryPort, CreateInvitationData } from '../ports/collaboration-repository.port';

/** Prisma adapter that accepts invitations and creates memberships atomically. */
export class PrismaCollaborationRepository implements CollaborationRepositoryPort {
  async findRole(userId: string, organizationId: string): Promise<CollaborationRole | null> {
    const member = await prisma.organizationMember.findFirst({
      where: { userId, organizationId, status: true, deletedAt: null },
      select: { role: true },
    });
    return member?.role as CollaborationRole | undefined ?? null;
  }

  async findUserEmail(userId: string): Promise<string | null> {
    const user = await prisma.user.findFirst({
      where: { id: userId, status: true, deletedAt: null },
      select: { email: true },
    });
    return user?.email ?? null;
  }

  async listMembers(organizationId: string): Promise<OrganizationMember[]> {
    const rows = await prisma.organizationMember.findMany({
      where: { organizationId, status: true, deletedAt: null },
      include: { user: { select: { email: true, fullName: true } } },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((row) => ({
      id: row.id,
      userId: row.userId,
      email: row.user.email,
      fullName: row.user.fullName,
      role: row.role as CollaborationRole,
      joinedAt: row.joinedAt,
    }));
  }

  async listPendingInvitations(organizationId: string): Promise<OrganizationInvitation[]> {
    const rows = await prisma.organizationInvitation.findMany({
      where: {
        organizationId,
        status: true,
        deletedAt: null,
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toInvitation);
  }

  async createInvitation(data: CreateInvitationData): Promise<OrganizationInvitation> {
    const [member, pending] = await Promise.all([
      prisma.user.findFirst({
        where: {
          email: { equals: data.email, mode: 'insensitive' },
          organizationMemberships: {
            some: { organizationId: data.organizationId, status: true, deletedAt: null },
          },
        },
        select: { id: true },
      }),
      prisma.organizationInvitation.findFirst({
        where: {
          organizationId: data.organizationId,
          email: { equals: data.email, mode: 'insensitive' },
          status: true,
          deletedAt: null,
          acceptedAt: null,
          expiresAt: { gt: new Date() },
        },
        select: { id: true },
      }),
    ]);
    if (member || pending) throw new InvitationConflictError();

    return toInvitation(await prisma.organizationInvitation.create({ data }));
  }

  async acceptInvitation(tokenHash: string, userId: string, email: string): Promise<string> {
    return prisma.$transaction(async (tx) => {
      const invitation = await tx.organizationInvitation.findFirst({
        where: {
          tokenHash,
          status: true,
          deletedAt: null,
          acceptedAt: null,
          expiresAt: { gt: new Date() },
        },
      });
      if (!invitation) throw new InvitationNotFoundError();
      if (invitation.email.toLowerCase() !== email) throw new InvitationEmailMismatchError();

      const existing = await tx.organizationMember.findUnique({
        where: { organizationId_userId: { organizationId: invitation.organizationId, userId } },
      });
      if (existing?.status && !existing.deletedAt) throw new InvitationConflictError('Ya perteneces a esta organización');

      if (existing) {
        await tx.organizationMember.update({
          where: { id: existing.id },
          data: { role: invitation.role, invitedBy: invitation.invitedBy, joinedAt: new Date(), status: true, deletedAt: null },
        });
      } else {
        await tx.organizationMember.create({
          data: {
            organizationId: invitation.organizationId,
            userId,
            role: invitation.role,
            invitedBy: invitation.invitedBy,
            joinedAt: new Date(),
          },
        });
      }
      await tx.organizationInvitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date(), status: false },
      });
      return invitation.organizationId;
    });
  }

  async revokeInvitation(invitationId: string, organizationId: string): Promise<boolean> {
    const result = await prisma.organizationInvitation.updateMany({
      where: { id: invitationId, organizationId, status: true, deletedAt: null, acceptedAt: null },
      data: { status: false, deletedAt: new Date() },
    });
    return result.count > 0;
  }
}

function toInvitation(row: { id: string; organizationId: string; email: string; role: string; expiresAt: Date; createdAt: Date }): OrganizationInvitation {
  return { ...row, role: row.role as InvitableRole };
}
