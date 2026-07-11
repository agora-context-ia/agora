import { Router, type Request, type Response } from 'express';
import {
  AiProviderNotConfiguredError,
  LlmRequestFailedError,
  NotOrganizationMemberError,
  SpaceNotFoundInOrganizationError,
  UnknownChatModelError,
} from '../../../contexts/ai/modules/chat/domain/chat';
import { container } from '../../container';
import { requireAuth } from '../require-auth';

const MAX_MESSAGE_LENGTH = 8000;

// mergeParams: montado en /api/organizations/:orgId/spaces/:spaceId/chat.
export const chatRouter: Router = Router({ mergeParams: true });

chatRouter.use(requireAuth);

chatRouter.get('/', async (req: Request, res: Response) => {
  const { orgId, spaceId } = req.params as { orgId: string; spaceId: string };

  try {
    const messages = await container.getChatHistory.execute(req.userId!, orgId, spaceId);
    return res.json({ messages });
  } catch (error) {
    return handleChatError(error, res);
  }
});

chatRouter.post('/', async (req: Request, res: Response) => {
  const { orgId, spaceId } = req.params as { orgId: string; spaceId: string };
  const { content, mode, model } = (req.body ?? {}) as Record<string, unknown>;

  if (typeof content !== 'string' || content.trim().length === 0) {
    return res.status(400).json({ error: 'El mensaje no puede estar vacío' });
  }
  if (content.length > MAX_MESSAGE_LENGTH) {
    return res
      .status(400)
      .json({ error: `El mensaje no puede superar ${MAX_MESSAGE_LENGTH} caracteres` });
  }

  try {
    const result = await container.sendChatMessage.execute({
      userId: req.userId!,
      organizationId: orgId,
      spaceId,
      content: content.trim(),
      mode: typeof mode === 'string' ? mode : 'general',
      model: typeof model === 'string' && model.length > 0 ? model : null,
    });
    return res.json(result);
  } catch (error) {
    return handleChatError(error, res);
  }
});

function handleChatError(error: unknown, res: Response): Response {
  if (error instanceof NotOrganizationMemberError) {
    return res.status(403).json({ error: error.message });
  }
  if (error instanceof SpaceNotFoundInOrganizationError) {
    return res.status(404).json({ error: error.message });
  }
  if (error instanceof UnknownChatModelError) {
    return res.status(400).json({ error: error.message });
  }
  if (error instanceof AiProviderNotConfiguredError) {
    // 409: the request is valid but the org configuration is missing.
    return res.status(409).json({ error: error.message });
  }
  if (error instanceof LlmRequestFailedError) {
    return res.status(502).json({ error: error.message });
  }
  throw error;
}
