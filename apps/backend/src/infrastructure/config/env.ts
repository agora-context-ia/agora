/** Typed view of the process environment with local-development defaults. */
export const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'local',
  PORT: Number(process.env.PORT ?? 3000),
  DATABASE_URL: process.env.DATABASE_URL ?? '',
  // Allowed origins for CORS with credentials (the frontend). Accepts a
  // comma-separated list to run more than one local dev server.
  CORS_ORIGINS: (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  FRONTEND_URL: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  // The session cookie carries the Secure flag except in local (http://).
  // It can be forced with COOKIE_SECURE=true.
  COOKIE_SECURE:
    process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production',

  // Redis: processing queue (BullMQ) + SSE registry/pub-sub.
  REDIS_URL: process.env.REDIS_URL ?? 'redis://localhost:6379',

  // Embeddings: swappable provider. Vectors always have EMBEDDING_DIM
  // dimensions (768: compatible with Gemini and local Ollama models).
  EMBEDDING_PROVIDER: (process.env.EMBEDDING_PROVIDER ?? 'ollama') as 'ollama' | 'gemini',
  EMBEDDING_MODEL: process.env.EMBEDDING_MODEL ?? 'nomic-embed-text',
  EMBEDDING_DIM: Number(process.env.EMBEDDING_DIM ?? 768),
  OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434',

  // Local-development fallback keys per LLM provider. In real deployments
  // each organization stores its own key (encrypted) from Settings.
  // OLLAMA_CHAT_MODELS (comma-separated) is read by the provider catalog.
  GEMINI_API_KEY: process.env.GEMINI_API_KEY ?? '',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? '',
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ?? '',

  // Symmetric key (32 bytes hex) to encrypt per-organization AI provider
  // API keys. See aes-credential-cipher.ts.
  CREDENTIALS_ENCRYPTION_KEY: process.env.CREDENTIALS_ENCRYPTION_KEY ?? '',

  // Local folder where uploaded files are stored.
  UPLOADS_DIR: process.env.UPLOADS_DIR ?? './storage/uploads',
};
