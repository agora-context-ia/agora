import { Router, type Request, type Response } from 'express';
import {
  InvalidApiKeyError,
  KeylessProviderError,
  NotOrganizationAdminError,
  NotOrganizationMemberError,
  UnknownAiProviderError,
} from '../../../contexts/identity/modules/ai-credentials/domain/ai-provider-credential';
import { container } from '../../container';
import { requireAuth } from '../require-auth';

// mergeParams: el router se monta en /api/organizations/:orgId/ai-settings
// y necesita leer :orgId del path padre. Las keys nunca se devuelven
// completas: solo apiKeyLastFour.
export const aiSettingsRouter: Router = Router({ mergeParams: true });

aiSettingsRouter.use(requireAuth);

aiSettingsRouter.get('/', async (req: Request, res: Response) => {
  const { orgId } = req.params as { orgId: string };

  try {
    const providers = await container.listProviderCredentials.execute(req.userId!, orgId);
    return res.json({ providers });
  } catch (error) {
    if (error instanceof NotOrganizationMemberError) {
      return res.status(403).json({ error: error.message });
    }
    throw error;
  }
});

aiSettingsRouter.put('/:provider', async (req: Request, res: Response) => {
  const { orgId, provider } = req.params as { orgId: string; provider: string };
  const { apiKey } = (req.body ?? {}) as Record<string, unknown>;

  if (typeof apiKey !== 'string' || apiKey.trim().length === 0) {
    return res.status(400).json({ error: 'La API key es obligatoria' });
  }

  try {
    const credential = await container.saveProviderCredential.execute({
      userId: req.userId!,
      organizationId: orgId,
      provider,
      apiKey,
    });
    return res.json({ credential });
  } catch (error) {
    if (error instanceof UnknownAiProviderError) {
      return res.status(404).json({ error: error.message });
    }
    if (error instanceof InvalidApiKeyError || error instanceof KeylessProviderError) {
      return res.status(400).json({ error: error.message });
    }
    if (
      error instanceof NotOrganizationMemberError ||
      error instanceof NotOrganizationAdminError
    ) {
      return res.status(403).json({ error: error.message });
    }
    throw error;
  }
});
