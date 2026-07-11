# AGENTS.md — Architecture rules and code conventions

Guide for humans and AI agents working on this repo. It defines the
architecture contracts (DDD + ports and adapters) and the checklists for
building new features. If a change cannot follow a rule, document why in
the PR — never ignore it silently.

## Monorepo map

```
apps/backend      → Express + Prisma API (hexagonal DDD by contexts)
apps/frontend     → React + Vite (features with ports and adapters)
packages/shared-types → DTOs shared between back and front
environments/     → .env.local (never commit .env files)
```

- Package manager: pnpm workspaces. Local infra:
  `docker compose --env-file environments/.env.local up -d postgres redis ollama`.

## Language and documentation

- **Everything in the codebase is written in English**: identifiers,
  comments, JSDoc, commit messages, and docs.
- **User-facing strings are the only exception**: UI texts and domain
  error messages shown to end users are in Spanish (the product language).
- **JSDoc is required on every exported class, function, and hook.**
  Explain intent and constraints — what the caller must know — not a
  restating of the signature. Interfaces (ports, DTOs) get a short JSDoc
  on the type and on non-obvious members.

---

## Backend (`apps/backend/src`)

### Structure: context → module → layers

```
contexts/<context>/modules/<module>/
  domain/      → models, catalogs and errors owned by the module. No infra imports.
  ports/       → interfaces (contracts) the module needs from the outside.
  use-cases/<case-name>/<case-name>.use-case.ts
  infra/       → adapters implementing ports (Prisma, Redis, external HTTP).
infrastructure/  → composition root and cross-cutting details (see below).
shared/          → shared kernel: pure data and functions, no side effects.
```

Current contexts: `identity` (auth, organizations, ai-credentials),
`knowledge-management` (documents, projects), `ai` (chat), `parameters` (catalogs).

### Dependency rules (the ones that matter)

1. **`domain/` imports nothing** outside its own module (no infra, no
   Prisma, no env). Pure types and logic only. Importing from `shared/`
   is allowed.
2. **`use-cases/` depend only on `domain/`, `ports/` and `shared/`.**
   Adapters are injected through the constructor (manual DI). They never
   import Prisma, `env`, Redis or Express.
3. **`infra/` is the only layer that touches the real world**: Prisma
   (`infrastructure/persistence/prisma-client`), Redis, `env`, external
   APIs. Every adapter implements a port of its own module.
4. **Cross-context imports are forbidden in `domain/` and `use-cases/`.**
   When a module needs something from another context (e.g. "is this user
   a member of the org?"), it defines **its own port**. Cross-context
   imports are allowed only in two places:
   - `infra/` adapters acting as anti-corruption layers (an adapter may
     compose another context's ports to implement a local port), and
   - the composition root (`container.ts`), which wires everything.
5. **`shared/` is a shared kernel**: pure functions and static data used
   by several contexts (e.g. `slugify`, the AI provider catalog). Nothing
   stateful, nothing with I/O.
6. **Domain errors are duplicated per module on purpose** (e.g.
   `NotOrganizationMemberError` exists in several modules). Each module
   owns its errors; do not centralize them into a shared errors package.

### Composition and HTTP

- **`infrastructure/container.ts` is the only composition root**: it
  instantiates repositories, adapters and use cases. No other file calls
  `new XxxUseCase(...)` (tests use in-memory fakes).
- **Routes (`infrastructure/http/routes/*.routes.ts`) stay thin**: they
  validate the request shape, call a use case from the container, and map
  domain errors to HTTP with `instanceof`:
  - membership/authorization errors → 403
  - not-found errors → 404
  - validation / unknown catalog values → 400
  - state conflicts → 409
  - external provider failures → 502
  Anything unmapped falls through to the generic 500 handler. Never leak
  internal exception messages to the client.
- Session auth (cookie) is resolved in middleware; use cases receive an
  already-validated `userId`.

### Persistence

- Every schema change ships as a **versioned Prisma migration** in
  `prisma/migrations/` (including triggers/seeds in the SQL when needed).
  Never `db push` against a shared database.
- Encrypted secrets (AI provider API keys): AES-256-GCM behind
  `CredentialCipherPort`. **The key — plain or encrypted — never leaves
  over HTTP**; only `apiKeyLastFour` is exposed.

### Tests

- Unit tests live in `apps/backend/test/unit/` and use **in-memory fakes
  of the ports** (see `fake-ai-credentials-module.ts` as reference).
  Prisma is never mocked: if a use case would need a Prisma mock, its
  wiring is wrong.
- Every new use case ships with tests for: happy path, authorization
  failures, and domain errors.
- Run: `npx vitest run` and `npx tsc --noEmit` inside `apps/backend`.

### Checklist: new backend feature

1. Pick the context/module (or create a new module with the 4 folders).
2. `domain/`: model + errors for the case.
3. `ports/`: any new contracts the use case needs.
4. `use-cases/<name>/<name>.use-case.ts` with constructor-injected deps.
5. `infra/`: adapters implementing the new ports.
6. Wire everything in `container.ts`.
7. Route in `infrastructure/http/routes/` with `instanceof` → status mapping.
8. Prisma migration if the schema changed.
9. Unit tests with fakes + typecheck.

---

## Frontend (`apps/frontend/src`)

### Structure: feature → layers

```
features/<feature>/
  domain/       → model types of the feature (no dependencies).
  ports/        → API client interface (e.g. chat-api.port.ts).
  infra/        → http-<feature>-api.adapter.ts: implements the port with apiFetch.
  application/  → hooks (use-*.ts) and zustand stores. Only layer that uses infra.
  components/   → pure React: consume hooks, never call fetch.
app/            → application shell and layout.
components/ui/  → shadcn/ui primitives. No business logic.
lib/            → apiFetch, realtime (SSE), utils. Cross-cutting.
```

### Rules

1. **Components never call `fetch`/`apiFetch`**: they consume hooks from
   `application/`.
2. **Hooks never call `fetch` directly**: they go through the `infra/`
   adapter via the port. The adapter is the only place that knows URLs
   and DTOs.
3. **Backend DTOs come from `@contexthub/shared-types`** and the adapter
   **maps them to `domain/` types** (e.g. `SpaceDto → Project`).
   Components never see a raw DTO.
4. **Cross-feature**: a feature may import from another feature **only
   `application/` hooks and `domain/` types** (e.g. `useActiveOrganization`).
   Never another feature's `infra/` or ports. Zustand stores are internal
   to their feature: **export named hooks, consume hooks — never the raw
   store — from other features**.
5. **Global state**: zustand, defined in `application/` of the feature
   that owns the data. UI-local state → `useState` in the component.
6. **API errors**: `ApiError` from `lib/api`. The hook decides the
   presentation (e.g. chat surfaces it as an assistant message prefixed
   with ⚠️).
7. Assistant replies render through `MarkdownContent` (react-markdown +
   remark-gfm); user messages render as plain text.

### Checklist: new frontend feature

1. Types in `domain/`.
2. Port in `ports/` + `http-*.adapter.ts` in `infra/` (shared-types DTOs,
   mapped to domain).
3. Hook in `application/` that uses the adapter and exposes state + actions.
4. Components in `components/` consuming the hook.
5. `npx tsc --noEmit` inside `apps/frontend`.

---

## shared-types (`packages/shared-types`)

- Contains **only HTTP contract DTOs** (request/response shapes) and
  realtime event types. No logic.
- A change in a backend response ⇒ update the DTO here and the frontend
  adapter mapping in the same PR.

---

## Naming glossary

| UI / frontend | Backend / DB |
|---|---|
| Project (`Project`) | `Space` (`spaces` table) |
| Source / document | `Document` + chunks + embeddings |
| Organization | `Organization` (multi-tenant, isolates everything) |

The frontend says "project" and the backend says "space" **on purpose**
(user language vs. domain language); the mapping lives in
`features/projects/infra/http-project-api.adapter.ts`. Do not rename one
side to "align" them without an explicit decision.

## Naming conventions

- Files: `kebab-case` with a role suffix: `*.use-case.ts`, `*.port.ts`,
  `*.repository.ts` (persistence), `*.adapter.ts` (other adapters),
  `*.routes.ts`, `use-*.ts` (hooks). Classes: `Http*Adapter`,
  `Prisma*Repository`.
- One use case per folder: `use-cases/<action>/<action>.use-case.ts`.
- Commits: short imperative subject line.
