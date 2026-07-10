import { Router, type Request, type Response } from 'express';
import { CatalogNotFoundError } from '../../../contexts/parameters/modules/catalogs/domain/catalog';
import { container } from '../../container';
import { requireAuth } from '../require-auth';

// Catálogos de solo lectura (schema parameters): el front los usa para
// poblar selects. Referenciados SIEMPRE por code, nunca por id.
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
