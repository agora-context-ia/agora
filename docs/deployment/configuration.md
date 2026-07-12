# Configuration

All configuration is by environment variables, organized in three
`environments/` folders. `.env.local` files hold real values for local
use; never commit real secrets to a shared repository.

## Root — `environments/.env.local` (Docker Compose)

| Variable | Purpose | Example |
|---|---|---|
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | Postgres credentials/database | `contexthub` |
| `POSTGRES_PORT` | Host port for Postgres | `5432` |
| `REDIS_PASSWORD` | Redis auth | — |
| `REDIS_PORT` | Host port for Redis | `6379` |
| `OLLAMA_PORT` | Host port for Ollama | `11434` |
| `EMBEDDING_MODEL` | Model the `ollama-init` sidecar pre-pulls | `nomic-embed-text` |

## Backend — `apps/backend/environments/.env.local`

| Variable | Purpose | Default |
|---|---|---|
| `NODE_ENV` | Environment name | `local` |
| `PORT` | API port | `3000` |
| `DATABASE_URL` | Postgres connection string | — |
| `CORS_ORIGIN` | Allowed frontend origins (comma-separated) | `http://localhost:5173` |
| `COOKIE_SECURE` | Force the `Secure` flag on the session cookie | `false` locally, `true` in production |
| `REDIS_URL` | Redis connection (queue + pub/sub) | `redis://localhost:6379` |
| `EMBEDDING_PROVIDER` | `ollama` or `gemini` | `ollama` |
| `EMBEDDING_MODEL` | Embedding model name | `nomic-embed-text` |
| `EMBEDDING_DIM` | Vector dimensions (must match the DB column) | `768` |
| `OLLAMA_BASE_URL` | Ollama server URL (embeddings + local chat models) | `http://localhost:11434` |
| `OLLAMA_CHAT_MODELS` | Chat models offered by the local Ollama provider (comma-separated; each must be pulled) | `llama3.1:8b,qwen3:8b` |
| `GEMINI_API_KEY` | Fallback Gemini key when an org has no credential configured | *(empty)* |
| `OPENAI_API_KEY` | Fallback OpenAI key when an org has no credential configured | *(empty)* |
| `ANTHROPIC_API_KEY` | Fallback Anthropic key when an org has no credential configured | *(empty)* |
| `CREDENTIALS_ENCRYPTION_KEY` | **Required.** 32-byte hex key (AES-256-GCM) for org AI credentials. Generate: `openssl rand -hex 32` | — |
| `UPLOADS_DIR` | Where uploaded files are stored | `./storage/uploads` |

> **Key rotation caveat:** changing `CREDENTIALS_ENCRYPTION_KEY` makes
> previously stored org API keys undecryptable; organizations would need
> to re-enter them.

## Frontend — `apps/frontend/environments/.env.local`

| Variable | Purpose | Default |
|---|---|---|
| `VITE_API_URL` | Backend base URL | `http://localhost:3000` |

Vite only exposes variables prefixed with `VITE_` to client code, and
reads them from `apps/frontend/environments/` (configured via `envDir`).

## Notes

- The backend loads its env file through `dotenv-cli` in the `dev` /
  `db:migrate:local` scripts; in containers, variables are injected by
  the orchestrator instead.
- `EMBEDDING_DIM` is fixed at 768 by the database column
  (`vector(768)`); changing it requires a migration and re-indexing.
