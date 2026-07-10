import { Router, type Request, type Response } from 'express';
import { SpaceNotFoundInOrganizationError } from '../../../contexts/knowledge-management/modules/documents/domain/document';
import { NotOrganizationMemberError } from '../../../contexts/knowledge-management/modules/projects/domain/space';
import { container } from '../../container';
import { requireAuth } from '../require-auth';

// Montado en /api/organizations/:orgId/spaces/:spaceId/search
export const searchRouter: Router = Router({ mergeParams: true });

searchRouter.use(requireAuth);

searchRouter.post('/', async (req: Request, res: Response) => {
  const { orgId, spaceId } = req.params as { orgId: string; spaceId: string };
  const { query, limit } = (req.body ?? {}) as Record<string, unknown>;

  if (typeof query !== 'string' || query.trim().length === 0) {
    return res.status(400).json({ error: 'Falta el texto a buscar' });
  }
  if (limit !== undefined && (typeof limit !== 'number' || !Number.isInteger(limit))) {
    return res.status(400).json({ error: 'limit debe ser un entero' });
  }

  try {
    const hits = await container.searchChunks.execute(
      req.userId!,
      orgId,
      spaceId,
      query.trim(),
      limit as number | undefined,
    );
    return res.json({ hits });
  } catch (error) {
    if (error instanceof NotOrganizationMemberError) {
      return res.status(403).json({ error: error.message });
    }
    if (error instanceof SpaceNotFoundInOrganizationError) {
      return res.status(404).json({ error: error.message });
    }
    throw error;
  }
});
