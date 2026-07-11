import { Router, type Request, type Response } from 'express';
import { CatalogNotFoundError } from '../../../contexts/parameters/modules/catalogs/domain/catalog';
import { container } from '../../container';
import { requireAuth } from '../require-auth';

// Read-only catalogs (parameters schema): the frontend uses them to
// populate selects. ALWAYS referenced by code, never by id.
export const catalogsRouter: Router = Router();

catalogsRouter.use(requireAuth);

catalogsRouter.get('/:code/items', async (req: Request, res: Response) => {
  const { code } = req.params as { code: string };
  try {
    const items = await container.listCatalogItems.execute(code);
    return res.json({ items });
  } catch (error) {
    if (error instanceof CatalogNotFoundError) {
      return res.status(404).json({ error: error.message });
    }
    throw error;
  }
});
