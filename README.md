<p align="center">
  <img src="apps/frontend/public/assets/agora-logo.png" alt="Ágora" height="72" />
</p>

<p align="center">
  <strong>Turn your organization's scattered knowledge into queryable, traceable context.</strong>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/node-%3E%3D20-339933?logo=node.js&logoColor=white" alt="Node >= 20"></a>
  <a href="https://pnpm.io"><img src="https://img.shields.io/badge/pnpm-workspaces-F69220?logo=pnpm&logoColor=white" alt="pnpm workspaces"></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white" alt="TypeScript"></a>
</p>

---

**Ágora** is an open source (MIT), **self-hostable knowledge platform**
that turns an organization's scattered information — manuals, meeting
minutes, business rules, requirements, decisions, and technical
documentation — into **queryable operational context** through natural
language.

Its real product is not "chatting with documents": it is **managing
organizational context** in a traceable way, keeping full control of
data, infrastructure, and AI provider in the hands of the user.

## Why Ágora

The knowledge needed to work correctly is usually fragmented: partly in
documents, partly in meetings, and largely in the memory of a few key
people. That means slow onboarding, decisions made without context, and
knowledge that walks out the door with every departure.

> An organization's knowledge should not disappear when a person leaves,
> stay hidden inside documents, or depend on who remembers a meeting.

Ágora loads that knowledge into **projects**, retrieves the relevant
fragments for every question (RAG over pgvector), and answers **with
citations** — persisted with each reply, so answers stay verifiable
forever. When there is not enough evidence, it says so instead of
inventing context.

## Features

- 🏢 **Multi-tenant organizations** — members, projects, and AI
  credentials fully isolated per tenant.
- 📁 **Knowledge projects** — each project scopes its sources and its
  conversations.
- 📄 **Document pipeline** — PDF, DOCX, TXT, MD, CSV, JSON (≤20 MB);
  background processing with text extraction, chunking, and embeddings.
- 💬 **Grounded chat** — seven task modes (explain a process, design a
  requirement, detect contradictions…), per-user conversation history per
  project, and **persisted citations** on every answer.
- ⚡ **Realtime everywhere** — document status and chat updates reach the
  UI over SSE; no polling.
- 🔒 **Privacy by structure** — self-hosted, local embeddings via Ollama
  by default, org AI keys encrypted at rest (AES-256-GCM) and never
  exposed over HTTP.
- 🔌 **Interchangeable AI provider** — Gemini, OpenAI, Anthropic, or
  **fully-local Ollama** (keyless) behind one abstraction; the chosen
  model picks the provider per message. Adding a provider is
  [one interface](docs/development/extending-agora.md).

## Quick start

Prerequisites: Node.js ≥ 20, pnpm ≥ 9, Docker + Docker Compose.

```bash
git clone https://github.com/maurohndz/contexthub-ai.git agora
cd agora
pnpm install

pnpm infra:up            # Postgres (pgvector) + Redis + Ollama — embedding model auto-pulled
pnpm db:migrate:local    # apply database migrations

pnpm dev:backend         # API    → http://localhost:3000
pnpm dev:frontend        # Web UI → http://localhost:5173
```

Then create your account, organization and first project, connect your
AI provider key, upload a document and ask. Full guide:
[docs/usage/getting-started.md](docs/usage/getting-started.md) ·
Configuration reference:
[docs/deployment/configuration.md](docs/deployment/configuration.md).

## Documentation

| | |
|---|---|
| 📘 [Product](docs/product/overview.md) | The problem, the value proposition, [principles](docs/product/principles.md), [use cases](docs/product/use-cases.md) |
| 🏗️ [Architecture](docs/architecture/overview.md) | Hexagonal DDD, the [knowledge pipeline](docs/architecture/knowledge-pipeline.md), [traceability](docs/architecture/traceability-and-citations.md), [ADRs](docs/architecture/decisions/) |
| 🚀 [Deployment](docs/deployment/installation.md) | Self-hosting, [configuration](docs/deployment/configuration.md), [security](docs/deployment/security-and-privacy.md), [costs](docs/deployment/cost-estimation.md) |
| 📖 [Usage](docs/usage/getting-started.md) | End-user guides |
| 🛠️ [Development](docs/development/setup.md) | Contributor setup, [standards](docs/development/coding-standards.md), [testing](docs/development/testing.md), [extending Ágora](docs/development/extending-agora.md) |
| 🗺️ [Roadmap](docs/roadmap.md) | Provider independence → collaboration → knowledge graph → launch |

## Tech stack

TypeScript end to end: **Express 5** + **Prisma** on a hexagonal (DDD)
backend · **React 18 + Vite** frontend · **PostgreSQL 18 + pgvector**
(HNSW) · **Redis** (BullMQ + pub/sub → SSE) · **Ollama** local embeddings
and chat · **Gemini / OpenAI / Anthropic** cloud chat models · **Vitest**.
Details in [docs/architecture/overview.md](docs/architecture/overview.md).

## Contributing

Contributions are welcome! Start with
[CONTRIBUTING.md](CONTRIBUTING.md) — git flow (`feature/*` from
`develop`), PR checklist — and the architecture contracts in
[AGENTS.md](AGENTS.md). Security reports: [SECURITY.md](SECURITY.md).

## License

[MIT](LICENSE) © 2026 Mauro Hernandez
