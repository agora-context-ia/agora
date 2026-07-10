import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { env } from '../config/env';
import { container } from '../container';
import { startDocumentProcessingWorker } from '../queue/document-processing.queue';
import { startRealtimeEventBus } from '../realtime/redis-event-bus';
import { authRouter } from './routes/auth.routes';
import { catalogsRouter } from './routes/catalogs.routes';
import { documentsRouter } from './routes/documents.routes';
import { eventsRouter } from './routes/events.routes';
import { organizationsRouter } from './routes/organizations.routes';
import { searchRouter } from './routes/search.routes';
import { spacesRouter } from './routes/spaces.routes';

export function startServer() {
  const app = express();

  // credentials: true -> el navegador acepta/envía la cookie de sesión
  // en requests cross-origin desde el frontend (fetch con include).
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/organizations', organizationsRouter);
  app.use('/api/organizations/:orgId/spaces', spacesRouter);
  app.use('/api/organizations/:orgId/spaces/:spaceId/documents', documentsRouter);
  app.use('/api/organizations/:orgId/spaces/:spaceId/search', searchRouter);
  app.use('/api/catalogs', catalogsRouter);
  app.use('/api/events', eventsRouter);

  // Pub/sub Redis -> sockets SSE locales, y worker de procesamiento de
  // documentos (mismo proceso por ahora).
  startRealtimeEventBus();
  startDocumentProcessingWorker(container.processDocument);

  app.listen(env.PORT, () => {
    console.log(`API escuchando en http://localhost:${env.PORT}`);
  });
}
