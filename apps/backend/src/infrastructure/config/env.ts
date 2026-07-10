export const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'local',
  PORT: Number(process.env.PORT ?? 3000),
  DATABASE_URL: process.env.DATABASE_URL ?? '',
  // Origen permitido para CORS con credenciales (el frontend).
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  // La cookie de sesión lleva el flag Secure salvo en local (http://).
  // Se puede forzar con COOKIE_SECURE=true.
  COOKIE_SECURE:
    process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production',

  // Redis: cola de procesamiento (BullMQ) + registro/pub-sub de SSE.
  REDIS_URL: process.env.REDIS_URL ?? 'redis://localhost:6379',

  // Embeddings: proveedor intercambiable. Los vectores siempre son de
  // EMBEDDING_DIM dims (768: compatible Gemini y modelos locales de Ollama).
  EMBEDDING_PROVIDER: (process.env.EMBEDDING_PROVIDER ?? 'ollama') as 'ollama' | 'gemini',
  EMBEDDING_MODEL: process.env.EMBEDDING_MODEL ?? 'nomic-embed-text',
  EMBEDDING_DIM: Number(process.env.EMBEDDING_DIM ?? 768),
  OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY ?? '',

  // Carpeta local donde se guardan los archivos subidos.
  UPLOADS_DIR: process.env.UPLOADS_DIR ?? './storage/uploads',
};
