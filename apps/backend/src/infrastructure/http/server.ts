import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { env } from '../config/env';
import { container } from '../container';
import { startDocumentProcessingWorker } from '../queue/document-processing.queue';
import { startRealtimeEventBus } from '../realtime/redis-event-bus';
import { aiSettingsRouter } from './routes/ai-settings.routes';
import { authRouter } from './routes/auth.routes';
import { catalogsRouter } from './routes/catalogs.routes';
import { chatRouter } from './routes/chat.routes';
import { documentsRouter } from './routes/documents.routes';
import { eventsRouter } from './routes/events.routes';
import { organizationsRouter } from './routes/organizations.routes';
import { searchRouter } from './routes/search.routes';
import { spacesRouter } from './routes/spaces.routes';

/** Builds the Express app, mounts every router and starts listening. */
export function startServer() {
  const app = express();

  // credentials: true -> the browser accepts/sends the session cookie on
  // cross-origin requests from the frontend (fetch with include).
  app.use(cors({ origin: env.CORS_ORIGINS, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/organizations', organizationsRouter);
  app.use('/api/organizations/:orgId/ai-settings', aiSettingsRouter);
  app.use('/api/organizations/:orgId/spaces', spacesRouter);
  app.use('/api/organizations/:orgId/spaces/:spaceId/documents', documentsRouter);
  app.use('/api/organizations/:orgId/spaces/:spaceId/search', searchRouter);
  app.use('/api/organizations/:orgId/spaces/:spaceId/chat', chatRouter);
  app.use('/api/catalogs', catalogsRouter);
  app.use('/api/events', eventsRouter);

  // Redis pub/sub -> local SSE sockets, plus the document processing
  // worker (same process for now).
  startRealtimeEventBus();
  startDocumentProcessingWorker(container.processDocument);

  app.listen(env.PORT, () => {
    console.log(`API escuchando en http://localhost:${env.PORT}`);
  });
}
