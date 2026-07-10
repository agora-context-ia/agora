import { Router, type Request, type Response } from 'express';
import {
  NotOrganizationMemberError,
  SpaceSlugTakenError,
} from '../../../contexts/knowledge-management/modules/projects/domain/space';
import { container } from '../../container';
import { requireAuth } from '../require-auth';

// mergeParams: el router se monta en /api/organizations/:orgId/spaces y
// necesita leer :orgId del path padre.
export const spacesRouter: Router = Router({ mergeParams: true });

spacesRouter.use(requireAuth);

spacesRouter.get('/', async (req: Request, res: Response) => {
  const { orgId } = req.params as { orgId: string };

  try {
    const spaces = await container.listSpacesByOrganization.execute(req.userId!, orgId);
    return res.json({ spaces });
  } catch (error) {
    if (error instanceof NotOrganizationMemberError) {
      return res.status(403).json({ error: error.message });
    }
    throw error;
  }
});

spacesRouter.post('/', async (req: Request, res: Response) => {
  const { orgId } = req.params as { orgId: string };
  const { name, description } = (req.body ?? {}) as Record<string, unknown>;

  if (typeof name !== 'string' || name.trim().length < 2) {
    return res.status(400).json({ error: 'El nombre debe tener al menos 2 caracteres' });
  }
  if (description !== undefined && typeof description !== 'string') {
    return res.status(400).json({ error: 'La descripción debe ser texto' });
  }

  try {
    const space = await container.createSpace.execute({
      userId: req.userId!,
      organizationId: orgId,
      name: name.trim(),
      description,
    });
    return res.status(201).json({ space });
  } catch (error) {
    if (error instanceof NotOrganizationMemberError) {
      return res.status(403).json({ error: error.message });
    }
    if (error instanceof SpaceSlugTakenError) {
      return res.status(409).json({ error: error.message });
    }
    throw error;
  }
});
