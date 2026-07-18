import { Router, type Response } from 'express';
import {
  InsufficientOrganizationRoleError,
  InvitationConflictError,
  InvitationEmailMismatchError,
  InvitationNotFoundError,
  NotOrganizationMemberError,
  type InvitableRole,
} from '../../../contexts/identity/modules/collaboration/domain/collaboration';
import { container } from '../../container';
import { env } from '../../config/env';
import { requireAuth } from '../require-auth';

/** Authenticated organization collaboration and invitation routes. */
export const collaborationRouter: Router = Router();
collaborationRouter.use(requireAuth);

collaborationRouter.get('/organizations/:orgId/collaboration', async (req, res) => {
  try {
    const result = await container.manageCollaboration.list(req.userId!, req.params.orgId);
    return res.json({
      members: result.members.map((member) => ({ ...member, joinedAt: member.joinedAt?.toISOString() ?? null })),
      invitations: result.invitations.map(toInvitationDto),
    });
  } catch (error) { return handleError(error, res); }
});

collaborationRouter.post('/organizations/:orgId/invitations', async (req, res) => {
  const { email, role } = (req.body ?? {}) as Record<string, unknown>;
  if (typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: 'Ingresa un correo válido' });
  if (role !== 'admin' && role !== 'member') return res.status(400).json({ error: 'El rol debe ser administrador o miembro' });
  try {
    const result = await container.manageCollaboration.invite({ userId: req.userId!, organizationId: req.params.orgId, email, role: role as InvitableRole });
    return res.status(201).json({
      invitation: toInvitationDto(result.invitation),
      invitationUrl: `${env.FRONTEND_URL}/invitations/accept?token=${encodeURIComponent(result.token)}`,
    });
  } catch (error) { return handleError(error, res); }
});

collaborationRouter.delete('/organizations/:orgId/invitations/:invitationId', async (req, res) => {
  try {
    await container.manageCollaboration.revoke(req.userId!, req.params.orgId, req.params.invitationId);
    return res.status(204).end();
  } catch (error) { return handleError(error, res); }
});

collaborationRouter.post('/organization-invitations/accept', async (req, res) => {
  const { token } = (req.body ?? {}) as Record<string, unknown>;
  if (typeof token !== 'string' || token.length < 32) return res.status(400).json({ error: 'El enlace de invitación no es válido' });
  try {
    const organizationId = await container.manageCollaboration.accept(req.userId!, token);
    return res.json({ organizationId });
  } catch (error) { return handleError(error, res); }
});

function toInvitationDto(invitation: { id: string; organizationId: string; email: string; role: InvitableRole; expiresAt: Date; createdAt: Date }) {
  return { ...invitation, expiresAt: invitation.expiresAt.toISOString(), createdAt: invitation.createdAt.toISOString() };
}

function handleError(error: unknown, res: Response): Response {
  if (error instanceof NotOrganizationMemberError || error instanceof InsufficientOrganizationRoleError || error instanceof InvitationEmailMismatchError) return res.status(403).json({ error: error.message });
  if (error instanceof InvitationNotFoundError) return res.status(404).json({ error: error.message });
  if (error instanceof InvitationConflictError) return res.status(409).json({ error: error.message });
  throw error;
}
