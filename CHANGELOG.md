# Changelog

All notable changes to Ágora are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **LLM provider abstraction (roadmap Phase 1)**: OpenAI, Anthropic and
  **fully-local Ollama** chat providers alongside Gemini, behind a single
  port with a routing adapter
  ([ADR 0002](docs/architecture/decisions/0002-llm-provider-abstraction.md)).
  The chosen model picks the provider; Ollama is keyless and its model
  list is configured via `OLLAMA_CHAT_MODELS`. New backend env vars:
  `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OLLAMA_CHAT_MODELS`.
- English documentation tree under `/docs` (product, architecture,
  deployment, usage, development) and the project [roadmap](docs/roadmap.md).
- Community health files: CONTRIBUTING, CODE_OF_CONDUCT, SECURITY,
  CHANGELOG, issue/PR templates, CI workflow.

### Changed

- **Retrieval quality**: embeddings are now purpose-aware — documents and
  queries are embedded with the task prefixes/taskType their model
  expects (nomic prefixes on Ollama, `RETRIEVAL_DOCUMENT/QUERY` on
  Gemini) — and chat context applies a minimum-relevance floor instead of
  always injecting the top hits, with more fragments retrieved per
  question (8, up from 5).
- ⚠️ **Action required after upgrading**: documents indexed before this
  change must be **reprocessed** (per-document "Reprocesar" action) —
  their stored vectors lack the document-side prefix and would rank
  poorly against the new prefixed queries.

## [0.1.0] — 2026-07-11

The MVP: knowledge can be loaded and queried.

### Added

- **Authentication**: registration, login, cookie sessions.
- **Organizations**: multi-tenant boundary for members, projects and
  credentials.
- **Projects (spaces)**: knowledge containers per organization, with tags
  and realtime document counts.
- **Document pipeline**: upload (PDF, DOCX, TXT, MD, CSV, JSON, ≤20 MB),
  classification via catalogs, background processing (BullMQ) — text
  extraction, chunking, embeddings (Ollama `nomic-embed-text` by default,
  Gemini optional) stored in pgvector with HNSW search; reprocess and
  delete.
- **Chat with RAG**: per-user conversations per project with history,
  seven task modes, per-conversation Gemini model selection, and
  **persisted citations** (document + fragment + relevance) on every
  grounded answer.
- **Realtime**: SSE channel backed by Redis pub/sub; document and
  conversation events refresh the UI without polling.
- **Per-organization AI credentials**: Gemini API keys encrypted at rest
  (AES-256-GCM), only last-four exposed.
- **Ágora branding**: logo, favicon and product naming.
- Local infrastructure via Docker Compose (Postgres 18 + pgvector,
  Redis 7, Ollama with automatic embedding-model pull).

[Unreleased]: https://github.com/maurohndz/contexthub-ai/compare/main...develop
[0.1.0]: https://github.com/maurohndz/contexthub-ai/releases/tag/v0.1.0
