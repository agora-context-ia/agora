import { Router, type Request, type Response } from 'express';
import { container } from '../../container';
import { requireAuth } from '../require-auth';

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

  const organization = await container.createOrganization.execute({
    userId: req.userId!,
    name: name.trim(),
  });
  return res.status(201).json({ organization });
});
