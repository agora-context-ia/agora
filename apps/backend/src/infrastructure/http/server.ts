import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { env } from '../config/env';
import { authRouter } from './routes/auth.routes';
import { organizationsRouter } from './routes/organizations.routes';
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

  app.listen(env.PORT, () => {
    console.log(`API escuchando en http://localhost:${env.PORT}`);
  });
}
