# AI Provider Setup

Ágora uses AI in two independent roles — **embeddings** (indexing and
search) and **chat generation**. Each is configured separately.

## Embeddings

Configured by environment on the backend
(see [configuration.md](configuration.md)):

### Option A — Ollama (local, free, default)

```bash
EMBEDDING_PROVIDER=ollama
EMBEDDING_MODEL=nomic-embed-text
OLLAMA_BASE_URL=http://localhost:11434
```

Nothing else to do: `pnpm infra:up` starts Ollama and the `ollama-init`
sidecar pulls the model automatically on first run (it is idempotent —
warm volumes are not re-downloaded).

### Option B — Gemini embeddings

```bash
EMBEDDING_PROVIDER=gemini
GEMINI_API_KEY=<your key>
```

> Vectors are tagged with the model that produced them and search filters
> by model, so switching embedding providers is safe — but documents
> indexed with the old model must be **reprocessed** to be searchable
> under the new one.

## Chat generation (LLM)

Four providers are supported: **Google Gemini**, **OpenAI**,
**Anthropic Claude**, and **Ollama** (local, keyless). Cloud provider
credentials are configured **per organization, in the product UI**
(Settings → AI models), not by environment:

1. Log in and open **Configuración** from the left sidebar.
2. In the AI models section, paste the organization's API key for each
   provider you want to enable:
   - Gemini — [Google AI Studio](https://aistudio.google.com/apikey)
   - OpenAI — [platform.openai.com](https://platform.openai.com/api-keys)
   - Anthropic — [console.anthropic.com](https://console.anthropic.com/settings/keys)
3. Save. Keys are encrypted at rest (AES-256-GCM) and only their last
   four characters are ever shown again.

Members then pick the **model** per conversation; the model determines
the provider. The backend `GEMINI_API_KEY` / `OPENAI_API_KEY` /
`ANTHROPIC_API_KEY` env variables act only as fallbacks when an
organization has not configured its own credential; leave them empty to
force per-organization configuration.

## Fully local setup (Ollama chat)

The **Ollama** provider needs no API key — it uses the same Ollama server
as the embeddings and appears in Settings as *"Local — no requiere API
key"*. To enable models:

```bash
# Pull the models you want to offer (inside the infra container):
docker compose exec ollama ollama pull llama3.1:8b

# Backend env: which models the catalog offers (comma-separated).
OLLAMA_CHAT_MODELS=llama3.1:8b,qwen3:8b
```

With `EMBEDDING_PROVIDER=ollama` and an Ollama chat model selected in the
conversation, **the whole pipeline runs local and free** — no data leaves
your infrastructure.
