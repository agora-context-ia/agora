import { Router, type Request, type Response } from 'express';
import {
  newConnectionId,
  sseRegistry,
} from '../../realtime/sse-connection-registry';
import { requireAuth } from '../require-auth';

const HEARTBEAT_MS = 25_000;

// Per-user SSE channel: invalidation signal (the frontend refetches via
// the regular API when it receives an event). Opened on login.
export const eventsRouter: Router = Router();

eventsRouter.get('/', requireAuth, (req: Request, res: Response) => {
  const userId = req.userId as string;
  const connectionId = newConnectionId();

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // nginx: do not buffer the stream
  res.flushHeaders();
  res.write(': connected\n\n');

  void sseRegistry.register(userId, connectionId, res);

  const heartbeat = setInterval(() => {
    res.write(': ping\n\n');
    void sseRegistry.touch(userId);
  }, HEARTBEAT_MS);

  req.on('close', () => {
    clearInterval(heartbeat);
    void sseRegistry.unregister(userId, connectionId);
  });
});
