# Ágora

**Chat con tus documentos, con memoria por proyecto y organización.**

Ágora es una plataforma de conocimiento organizacional: subís documentos
(PDF, DOCX, TXT, MD, CSV, JSON) a un **proyecto**, y conversás con un asistente
de IA que responde con contexto real extraído de esas fuentes (RAG). Cada
usuario mantiene su propio historial de conversaciones por proyecto, y todo
se actualiza en tiempo real vía Server-Sent Events.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D20-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![pnpm](https://img.shields.io/badge/pnpm-workspaces-F69220?logo=pnpm&logoColor=white)](https://pnpm.io)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

---

## Tabla de contenidos

- [Características](#características)
- [Stack](#stack)
- [Arquitectura](#arquitectura)
- [Estructura del monorepo](#estructura-del-monorepo)
- [Requisitos](#requisitos)
- [Puesta en marcha](#puesta-en-marcha)
- [Variables de entorno](#variables-de-entorno)
- [Scripts disponibles](#scripts-disponibles)
- [Testing](#testing)
- [Git flow](#git-flow)
- [Contribuir](#contribuir)
- [Licencia](#licencia)

## Características

- **Multi-tenant por organización**: cada organización aísla sus miembros,
  proyectos y credenciales de IA.
- **Proyectos de conocimiento**: cada proyecto agrupa un set de documentos
  (fuentes) y sus conversaciones de chat.
- **Chat con RAG**: las respuestas se generan con fragmentos relevantes de
  tus documentos, recuperados por búsqueda semántica (pgvector + embeddings).
  Cada respuesta cita las fuentes que la fundamentaron.
- **Modos de conversación**: consulta general, explicar proceso, definir
  requerimiento, resumir, explicar reglas, detectar contradicciones y
  redactar criterios de aceptación.
- **Historial de chat por proyecto y usuario**: múltiples conversaciones en
  paralelo, cada una con su propio hilo persistido.
- **Tiempo real end-to-end**: subida/procesamiento de documentos y
  actualizaciones de chat se propagan al front por SSE — sin polling.
- **Credenciales de IA por organización**: cada organización configura su
  propio proveedor (Google Gemini) y API key, cifrada en reposo
  (AES-256-GCM) y nunca expuesta por HTTP.
- **Pipeline de ingesta de documentos**: extracción de texto, chunking,
  generación de embeddings (Ollama local o Gemini) y catalogación,
  procesado en cola (BullMQ) sin bloquear la subida.

## Stack

| Capa | Tecnología |
|---|---|
| Backend | Node.js + TypeScript, Express 5, arquitectura hexagonal (DDD) |
| Frontend | React 18 + Vite, Tailwind CSS, shadcn/ui (Radix) |
| Base de datos | PostgreSQL 18 + [pgvector](https://github.com/pgvector/pgvector) |
| Cola / Realtime | Redis (BullMQ + pub/sub → SSE) |
| Embeddings | Ollama (`nomic-embed-text`, local) o Gemini |
| LLM | Google Gemini (Flash / Flash Lite / Pro) |
| ORM | Prisma |
| Testing | Vitest (backend, in-memory fakes de los puertos) |
| Monorepo | pnpm workspaces |

## Arquitectura

El backend sigue **Clean/Hexagonal Architecture (DDD) por contextos**:

```
contexts/<context>/modules/<module>/
  domain/      → modelos, catálogos y errores del módulo (sin dependencias de infra)
  ports/       → contratos (interfaces) que el módulo necesita del exterior
  use-cases/   → un caso de uso por carpeta, con dependencias inyectadas por constructor
  infra/       → adapters que implementan los puertos (Prisma, Redis, HTTP externo)
```

Contextos actuales: `identity` (auth, organizaciones, credenciales de IA),
`knowledge-management` (documentos, proyectos), `ai` (chat), `parameters`
(catálogos).

El frontend espeja el mismo principio por **feature**, con `domain / ports /
infra / application (hooks + stores) / components`. Los componentes nunca
llaman `fetch` directo; todo pasa por un hook de `application/` que usa un
adapter de `infra/` a través de su puerto.

Las reglas completas de arquitectura, convenciones y checklists para
features nuevas están documentadas en **[AGENTS.md](AGENTS.md)** — léelo
antes de contribuir código.

## Estructura del monorepo

```
apps/backend          → API Express + Prisma (hexagonal DDD por contextos)
apps/frontend         → React + Vite (features con ports y adapters)
packages/shared-types → DTOs y contratos HTTP compartidos entre back y front
environments/         → variables de infraestructura (Docker) por ambiente
scripts/               → utilidades de desarrollo (p. ej. pull automático de modelos Ollama)
```

Cada app tiene además su propia carpeta `environments/` con `.env.local`
(uso local, no se versiona con secretos reales).

## Requisitos

- Node.js ≥ 20
- pnpm ≥ 9 (`corepack enable` si no lo tenés)
- Docker + Docker Compose (Postgres, Redis y Ollama corren en contenedores)

## Puesta en marcha

```bash
# 1. Instalar dependencias
pnpm install

# 2. Levantar infraestructura (Postgres con pgvector, Redis, Ollama)
pnpm infra:up

# 3. Correr las migraciones
pnpm db:migrate:local

# 4. Levantar backend y frontend (en terminales separadas)
pnpm dev:backend   # http://localhost:3000
pnpm dev:frontend  # http://localhost:5173
```

El modelo de embeddings (`nomic-embed-text`) se descarga automáticamente
la primera vez que se levanta `ollama` — no hace falta ningún paso manual.

Para bajar los contenedores: `pnpm infra:down`.

## Variables de entorno

Cada nivel tiene su propia carpeta `environments/.env.local`:

- **`/environments`** — variables de Docker Compose (usuario/password de
  Postgres y Redis, puertos, modelo de embeddings a precargar).
- **`/apps/backend/environments`** — `DATABASE_URL`, `REDIS_URL`,
  `CREDENTIALS_ENCRYPTION_KEY` (AES-256-GCM, generar con
  `openssl rand -hex 32`), configuración de embeddings, etc.
- **`/apps/frontend/environments`** — variables `VITE_*` (Vite solo expone
  al cliente las que tienen ese prefijo).

`.env.local` nunca se versiona con secretos reales (ver `.gitignore`).

## Scripts disponibles

Desde la raíz del monorepo:

| Comando | Descripción |
|---|---|
| `pnpm dev:backend` | Backend en modo watch |
| `pnpm dev:frontend` | Frontend con Vite dev server |
| `pnpm build` | Build de todos los paquetes |
| `pnpm test` | Tests de todos los paquetes |
| `pnpm infra:up` / `infra:down` | Levantar/bajar Postgres, Redis y Ollama |
| `pnpm db:migrate:local` | Aplicar migraciones de Prisma |

## Testing

```bash
# Backend: tests unitarios (fakes en memoria de los puertos, nunca mocks de Prisma)
cd apps/backend && npx vitest run test/unit

# Typecheck
cd apps/backend && npx tsc --noEmit
cd apps/frontend && npx tsc --noEmit
```

## Git flow

Este proyecto sigue **git flow** sobre cuatro ramas de larga vida:

```
main     → producción
preprod  → staging de release candidates
qa       → integración / testing
develop  → rama de integración de features
```

Todo desarrollo nuevo se hace en una rama `feature/<nombre>` cortada desde
`develop`, y vuelve a `develop` por Pull Request. La promoción siempre es
ascendente (`develop → qa → preprod → main`), sin saltarse etapas. Ver la
sección *Git flow* de [AGENTS.md](AGENTS.md) para el detalle completo,
incluyendo el flujo de `hotfix/*`.

## Contribuir

1. Hacé fork del repo y creá tu rama desde `develop`:
   `git checkout -b feature/mi-cambio develop`.
2. Seguí las convenciones de arquitectura y naming de
   [AGENTS.md](AGENTS.md) — es lectura obligatoria antes de tu primer PR.
3. Agregá tests para la lógica nueva (unit tests con fakes de los puertos
   en el backend) y corré `tsc --noEmit` en el/los paquete(s) que tocaste.
4. Abrí el Pull Request contra `develop`, con una descripción clara del
   *por qué* del cambio.

## Licencia

[MIT](LICENSE) © 2026 Mauro Hernandez
