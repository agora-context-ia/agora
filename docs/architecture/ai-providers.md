# AI Providers

Ágora separates the knowledge platform from the AI provider (*the AI model
is interchangeable* — [principle #5](../product/principles.md)). This page
describes how providers are integrated. Design rationale:
[ADR 0002](decisions/0002-llm-provider-abstraction.md).

## Two provider roles

| Role | Used for | Current options |
|---|---|---|
| **Embedding provider** | Indexing chunks + embedding questions | `ollama` (local, default) · `gemini` |
| **LLM provider** | Generating chat answers | Gemini · OpenAI · Anthropic · Ollama (local) |

These are independent: you can embed locally with Ollama and answer with
any chat provider — or run **fully local** with Ollama for both.

## Embedding providers

The documents module defines an `EmbeddingProviderPort`; `ollama` and
`gemini` adapters implement it. Selection is by environment:

```bash
EMBEDDING_PROVIDER=ollama          # or "gemini"
EMBEDDING_MODEL=nomic-embed-text
EMBEDDING_DIM=768                  # both providers produce 768-dim vectors
```

Vectors are tagged with the model that produced them, and retrieval always
filters by model — switching providers never mixes incompatible vectors.

Embeddings are **purpose-aware**: documents and queries are embedded
differently (`search_document:`/`search_query:` prefixes for nomic models
on Ollama, `taskType RETRIEVAL_DOCUMENT/RETRIEVAL_QUERY` on Gemini),
which retrieval-tuned models require for good ranking. Because the
document-side transformation is part of the stored vectors, **documents
indexed before this behavior existed must be reprocessed**.

## LLM providers

The chat module talks to LLMs through its own ports:

- `LlmProviderPort` — `generate({ provider, apiKey, model, systemPrompt, history, userMessage })`.
- `LlmCredentialPort` — resolves the organization's API key.

Four adapters implement the port — **Gemini**, **OpenAI**, **Anthropic**,
and **Ollama** (keyless, fully local) — all plain `fetch` calls with
normalized errors and token usage. A routing adapter dispatches each call
to the provider that owns the requested model, and the supported models
live in a shared catalog (`shared/ai-provider-catalog.ts`) using each
vendor's rolling aliases so model retirements don't break chat. Ollama's
model list is configurable via `OLLAMA_CHAT_MODELS`.

The user picks a **model** in the chat; the model determines the
provider. There is no separate provider switch — organizations can mix
providers per message (e.g. a cloud model for general questions, a local
model for sensitive spaces).

### Per-organization credentials

Each organization configures its own provider API keys in Settings. Keys
are encrypted at rest with **AES-256-GCM** and never leave the backend —
the API exposes only the last four characters. **Ollama needs no key**:
it is part of the deployment itself and always appears as available. See
[security-and-privacy.md](../deployment/security-and-privacy.md).

## Adding a provider

Implement one interface, register it in the catalog, wire it in the
container — the concrete three-step guide lives in
[extending-agora.md](../development/extending-agora.md). Token streaming
through the abstraction is deferred (see ADR 0002).
