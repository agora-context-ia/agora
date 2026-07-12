# Testing backlog

Inventory of every backend endpoint/use case and frontend feature, used to
drive test coverage one item at a time. Work top to bottom inside each
section; tick a box only when the suite is green.

Conventions live in [AGENTS.md](AGENTS.md) and
[.claude/agents/test-generator.md](.claude/agents/test-generator.md).
Legend: **U** unit (Vitest + fakes) · **C** contract suite for the port ·
**I** integration (Testcontainers / MSW) · **E** HTTP e2e (Supertest).

---

## Backend — endpoints and use cases

### identity / auth (`/api/auth`)

| Endpoint | Use case | U | C | I | E |
|---|---|---|---|---|---|
| POST `/api/auth/register` | `register-user` | [ ] | [ ] | [ ] | [ ] |
| POST `/api/auth/login` | `login-user` | [ ] | [ ] | [ ] | [ ] |
| POST `/api/auth/logout` | `logout-user` | [ ] | — | [ ] | [ ] |
| GET `/api/auth/me` | `get-current-user` | [ ] | — | [ ] | [ ] |
| PATCH `/api/auth/me` | `update-profile` | [ ] | — | [ ] | [ ] |

### identity / organizations (`/api/organizations`)

| Endpoint | Use case | U | C | I | E |
|---|---|---|---|---|---|
| GET `/api/organizations` | `list-my-organizations` | [x] | [ ] | [ ] | [ ] |
| POST `/api/organizations` | `create-organization` | [x] | [ ] | [ ] | [ ] |

### identity / ai-credentials (`/api/organizations/:orgId/ai-settings`)

| Endpoint | Use case | U | C | I | E |
|---|---|---|---|---|---|
| GET `/ai-settings` | `list-provider-credentials` | [ ] | [ ] | [ ] | [ ] |
| PUT `/ai-settings/:provider` | `save-provider-credential` | [x] | [ ] | [ ] | [ ] |

### knowledge-management / spaces (`/api/organizations/:orgId/spaces`)

| Endpoint | Use case | U | C | I | E |
|---|---|---|---|---|---|
| GET `/spaces` | `list-spaces-by-organization` | [ ] | [ ] | [ ] | [ ] |
| POST `/spaces` | `create-space` | [x] | [ ] | [ ] | [ ] |

### knowledge-management / documents (`…/spaces/:spaceId/documents`)

| Endpoint | Use case | U | C | I | E |
|---|---|---|---|---|---|
| GET `/documents` | `list-documents` | [ ] | [ ] | [ ] | [ ] |
| POST `/documents` (multipart upload) | `upload-document` | [x] | [ ] | [ ] | [ ] |
| DELETE `/documents/:documentId` | `delete-document` | [ ] | — | [ ] | [ ] |
| POST `/documents/:documentId/reprocess` | `reprocess-document` | [ ] | — | [ ] | [ ] |
| (worker, no endpoint) | `process-document` | [x] | [ ] | [ ] | — |

### knowledge-management / search (`…/spaces/:spaceId/search`)

| Endpoint | Use case | U | C | I | E |
|---|---|---|---|---|---|
| POST `/search` | `search-chunks` | [ ] | [ ] | [ ] | [ ] |

### ai / chat (`…/spaces/:spaceId/chat`)

| Endpoint | Use case | U | C | I | E |
|---|---|---|---|---|---|
| GET `/conversations` | `list-conversations` | [x] | [ ] | [ ] | [ ] |
| POST `/conversations` | `create-conversation` | [x] | [ ] | [ ] | [ ] |
| GET `/conversations/:id/messages` | `get-chat-history` | [x] | [ ] | [ ] | [ ] |
| POST `/conversations/:id/messages` | `send-chat-message` | [x] | [ ] | [ ] | [ ] |

### parameters / catalogs and events

| Endpoint | Use case | U | C | I | E |
|---|---|---|---|---|---|
| GET `/api/catalogs/:code/items` | `list-catalog-items` | [ ] | [ ] | [ ] | [ ] |
| GET `/api/events` (SSE) | — | — | — | [ ] | [ ] |

### Backend adapters and shared kernel (unit-tested directly)

- [x] `aes-credential-cipher`
- [x] `chunker`
- [x] `embedding-context-search.adapter`
- [x] `provider-routing-llm.adapter`
- [ ] `gemini-embedding.adapter` (contract vs fake embedding provider)
- [ ] `ollama-embedding.adapter` (contract vs fake embedding provider)
- [ ] `ai-provider-catalog` (shared)
- [ ] HTTP middleware: `requireAuth` (session/cookie handling)

### Cross-cutting backend milestones

- [ ] Object Mothers + Builders for aggregate roots
      (`User`, `Organization`, `Space`, `Document`, `Conversation`,
      `AiProviderCredential`) in `apps/backend/test/unit/mothers/`
- [ ] Contract suites per port in `apps/backend/test/contracts/`,
      running against fakes (unit) and Prisma adapters (integration)
- [ ] Testcontainers helper (`pgvector/pgvector:pg18` + `migrate deploy`
      + truncate between tests) in `apps/backend/test/integration/support/`
- [ ] Supertest e2e bootstrap (build the Express app against the test DB)

---

## Frontend — features

Frontend has no test tooling yet. Milestone 0 blocks everything below:

- [ ] **Milestone 0:** install Vitest + Testing Library + user-event +
      jest-dom + MSW + happy-dom; `apps/frontend/vitest.config.ts`;
      MSW server + render util in `apps/frontend/test/support/`;
      fixtures derived from `@contexthub-ai/shared-types`.

Per feature: **A** = adapter vs MSW (`infra/`), **H** = hooks
(`application/`), **P** = components by user behavior (`components/`).

### auth

- [ ] A `http-auth-api.adapter`
- [ ] H `use-auth`, `use-current-user`, `use-login`, `use-logout`, `use-register`
- [ ] P `LoginPage`, `RegisterPage`, `RequireAuth`, `UserSidebar`

### organizations

- [ ] A `http-organization-api.adapter`
- [ ] H `use-active-organization`, `use-create-organization`, `use-organization-list`
- [ ] P `CreateOrganizationDialog`, `OnboardingScreen`, `OrganizationMenu`

### projects

- [ ] A `http-project-api.adapter`
- [ ] H `use-active-project`, `use-project-list`
- [ ] P `CreateProjectDialog`, `ProjectSidebar`, `ProjectListItem`, `ProjectChatHistory`

### sources

- [ ] A `http-source-api.adapter`
- [ ] H `use-sources`, `use-upload-source`, `use-delete-source`,
      `use-reprocess-source`, `use-classifications`
- [ ] P `SourcesPage`, `SourceList`, `SourceListItem`, `SourceUploadZone`

### chat

- [ ] A `http-chat-api.adapter`
- [ ] H `use-conversation`, `use-send-message`
- [ ] P `ChatWindow`, `ChatInput`, `MessageList`, `MessageBubble`,
      `ModelSelector`, `ModeSelector`, `SourcesFootnote`, `EmptyState`

### settings

- [ ] A `http-settings-api.adapter`
- [ ] H `use-ai-provider-settings`, `use-settings-dialog`, `use-update-profile`
- [ ] P `SettingsDialog`, `GeneralSettingsSection`, `AiModelsSettingsSection`

---

## Architecture and CI

- [ ] dependency-cruiser rules encoding AGENTS.md constraints
      (domain imports nothing; use-cases only domain/ports/shared;
      only infra touches Prisma/Redis/env; frontend features mirror it)
- [ ] CI stages: unit → depcruise → integration → e2e
- [ ] Coverage gate on backend `domain/` + `use-cases/` only

## Optional / later

- [ ] Playwright e2e for 3–5 critical flows (register → create org →
      upload document → chat with sources)
