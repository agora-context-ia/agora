import { Router, type Request, type Response } from 'express';
import { OrganizationSlugTakenError } from '../../../contexts/identity/modules/organizations/domain/organization';
import { container } from '../../container';
import { requireAuth } from '../require-auth';

/** Routes for the authenticated user's organizations: list and create. */
export const organizationsRouter: Router = Router();

organizationsRouter.use(requireAuth);

organizationsRouter.get('/', async (req: Request, res: Response) => {
  const organizations = await container.listMyOrganizations.execute(req.userId!);
  return res.json({ organizations });
});

organizationsRouter.post('/', async (req: Request, res: Response) => {
  const { name } = (req.body ?? {}) as Record<string, unknown>;

  if (typeof name !== 'string' || name.trim().length < 2) {
    return res.status(400).json({ error: 'El nombre debe tener al menos 2 caracteres' });
  }

  try {
    const organization = await container.createOrganization.execute({
      userId: req.userId!,
      name: name.trim(),
    });
    return res.status(201).json({ organization });
  } catch (error) {
    // The use case retries slugs; this only fires on a concurrent-create race.
    if (error instanceof OrganizationSlugTakenError) {
      return res.status(409).json({ error: error.message });
    }
    throw error;
  }
});
