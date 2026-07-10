# Plan de implementación: Organizaciones + Espacios reales en la vista principal

## Objetivo de esta iteración

Que la vista principal deje de mostrar organizaciones/espacios mock y muestre
los reales de la base de datos, **filtrados al usuario autenticado** (solo
sus organizaciones, y los espacios de la organización que tenga
seleccionada). El chat/conversación queda **fuera de alcance**: sigue
mockeado como está hoy (`features/chat`, `mock-chat-api.adapter.ts`), no se
toca en esta iteración.

## Punto de partida (ya existe en el repo, verificado)

- **DB**: `apps/backend/prisma/schema.prisma` con `Organization`,
  `OrganizationMember`, `Space`, etc. Ya corrió la migración inicial
  (`apps/backend/prisma/migrations/20260709000000_init`).
- **Auth real y funcionando** (esto ya NO es mock):
  - Backend: `contexts/identity/modules/auth` completo (use-cases
    `register-user`, `login-user`, `logout-user`, `get-current-user`,
    repos Prisma, `bcrypt-password-hasher`), rutas en
    `infrastructure/http/routes/auth.routes.ts` montadas en `/api/auth`,
    sesión por cookie httpOnly (`session-cookie.ts`, nombre
    `contexthub_session`), `container.ts` como composition root manual.
  - Frontend: `features/auth` con `http-auth-api.adapter.ts` (ya no mock),
    `RequireAuth`, `useCurrentUser`, `useLogin`, `useRegister`.
- **Todavía mock**:
  - `features/organizations`: `OrganizationMenu.tsx` (en el sidebar
    izquierdo, dentro de `UserSidebar`) + `use-organization-list.ts` /
    `use-active-organization.ts` (zustand) → hoy leen de
    `mock-organization-api.adapter.ts`.
  - `features/projects`: `ProjectSidebar.tsx` ya filtra espacios por
    `activeOrganizationId`, pero `mock-project-api.adapter.ts` sigue
    devolviendo los 3 proyectos hardcodeados.
  - Backend: `contexts/knowledge-management/modules/projects` está vacío
    (solo `.gitkeep`). No existe todavía ningún módulo de organizaciones
    en el backend.

Fuera de alcance de este plan: invitaciones por email, roles granulares
más allá de owner/admin/member, y **el chat** (se mantiene mock a propósito).

## 1. Backend

### 1.1 Middleware de auth para rutas nuevas

Ya existe la lógica para validar sesión (la usa `GET /api/auth/me`). Extraerla
a un middleware reusable en vez de duplicarla:

```
infrastructure/http/require-auth.ts
```

Lee la cookie `contexthub_session`, llama a
`container.getCurrentUser.execute(token)`, y si hay usuario válido setea
`req.userId` (declarar el tipo augmentado de `Request`); si no, `401`. Las
rutas de organizations/spaces lo usan como middleware — nada de headers
temporales tipo `x-user-id`, la sesión real ya está lista para esto.

### 1.2 Módulo `organizations` (nuevo contexto `identity`, mismo patrón que `auth`)

```
identity/modules/organizations/
  domain/organization.ts
  use-cases/create-organization/create-organization.use-case.ts
  use-cases/list-my-organizations/list-my-organizations.use-case.ts
  infra/prisma-organization.repository.ts
```

- `CreateOrganizationUseCase`: `prisma.$transaction` → crea `Organization`
  (`createdBy: userId`) + `OrganizationMember` (`role: 'owner'`,
  `joinedAt: now()`). Slug generado desde el nombre, con sufijo si colisiona.
- `ListMyOrganizationsUseCase(userId)`: **el filtro clave que pediste** —
  `prisma.organizationMember.findMany({ where: { userId, status: true,
  deletedAt: null }, include: { organization: true } })`, devuelve solo las
  organizaciones donde el usuario es member activo. Nunca todas las
  organizaciones de la tabla.

Rutas (`infrastructure/http/routes/organizations.routes.ts`, montadas en
`/api/organizations`, con `requireAuth`):

```
POST   /api/organizations              body: { name }
GET    /api/organizations              -> solo las del usuario autenticado
```

### 1.3 Módulo `spaces` (dentro de `knowledge-management/modules/projects`, ya tiene la carpeta)

```
knowledge-management/modules/projects/
  domain/space.ts
  use-cases/create-space/create-space.use-case.ts
  use-cases/list-spaces-by-organization/list-spaces-by-organization.use-case.ts
  infra/prisma-space.repository.ts
```

- `ListSpacesByOrganizationUseCase(userId, organizationId)`: primero
  verifica que el usuario sea member activo de esa organización (si no,
  `403`), después devuelve **todos** los espacios de la organización — regla
  ya acordada: dentro de una organización no hay espacios privados entre
  miembros.
- `CreateSpaceUseCase`: misma verificación de membresía, slug único vía
  `@@unique([organizationId, slug])` (ya está en el schema).

Rutas (`spaces.routes.ts`, montadas en `/api/organizations/:orgId/spaces`,
con `requireAuth`):

```
POST   /api/organizations/:orgId/spaces   body: { name, description }
GET    /api/organizations/:orgId/spaces
```

### 1.4 Wiring

Agregar ambos módulos a `container.ts` (mismo patrón que auth: instanciar
repos Prisma + use-cases), y montar los routers en `server.ts` junto a
`authRouter`.

### 1.5 DTOs compartidos

`packages/shared-types/src/index.ts`: `OrganizationDto`, `CreateOrganizationDto`,
`SpaceDto`, `CreateSpaceDto`.

## 2. Frontend

### 2.1 Adapters reales (reemplazan los mock, mismo patrón que `http-auth-api.adapter.ts`)

- `features/organizations/infra/http-organization-api.adapter.ts`: `fetch`
  con `credentials: 'include'` (para que viaje la cookie de sesión) contra
  `${import.meta.env.VITE_API_URL}/api/organizations`.
- `features/projects/infra/http-project-api.adapter.ts`: ídem contra
  `/api/organizations/:orgId/spaces`, usando `activeOrganizationId`.
- Los ports (`OrganizationApiPort`, `ProjectApiPort`) no cambian — es solo
  swappear qué adapter usan `use-organization-list.ts` y `use-project-list.ts`.
  No hace falta flag de mocks: como el chat sigue mock por separado, alcanza
  con cambiar el import en esos dos hooks cuando el backend esté listo.

### 2.2 Onboarding: usuario sin organización

`RegisterPage`/`LoginPage` ya redirigen a `/`. Falta el caso "usuario real,
cero organizaciones" (todo usuario nuevo empieza así):

- Si `useOrganizationList()` termina de cargar y `organizations.length === 0`,
  mostrar pantalla de onboarding ("Creá tu primera organización") en vez del
  `AppShell` normal.
- Nuevo `CreateOrganizationDialog` (mismo patrón que `CreateProjectDialog`):
  nombre → adapter real → se agrega al store → queda como organización activa.

### 2.3 Integrar la vista principal

- `ProjectSidebar` y `OrganizationMenu` pasan a alimentarse de datos reales
  sin cambiar su lógica interna (ya están armados para eso).
- **Bug pendiente a corregir en esta misma iteración**: al cambiar de
  organización, `activeProjectId` (store separado) no se recalcula. Agregar
  `useEffect` que, cuando cambia `activeOrganizationId`, llama
  `setActiveProject` al primer espacio visible de la nueva organización (o
  `null` si no tiene ninguno).
- `ChatWindow` sigue con `mockChatApiAdapter`, pero debe leer el
  `activeProjectId` real para mostrar el `EmptyState` correcto cuando la
  organización real todavía no tiene espacios — es la única conexión entre
  el chat (mock) y los datos reales por ahora.

## 3. Orden sugerido

1. Backend: `require-auth` middleware.
2. Backend: módulo `organizations` (use-cases + repo + rutas) — incluye el
   filtro "solo mis organizaciones".
3. Backend: módulo `spaces` + wiring en `container.ts`/`server.ts`.
4. Frontend: `http-organization-api.adapter.ts` + `http-project-api.adapter.ts`,
   swap en los hooks.
5. Frontend: `CreateOrganizationDialog` + onboarding sin organización.
6. Frontend: fix del `activeProjectId` al cambiar de organización +
   `EmptyState` en `ChatWindow` sin espacio activo.

Explícitamente NO en esta iteración: nada de `features/chat` más allá de
leer el espacio activo — el envío/recepción de mensajes sigue mock.

## 4. Verificación

- Backend: test unitario de `ListMyOrganizationsUseCase` confirmando que
  con dos usuarios en organizaciones distintas, cada uno solo ve las suyas
  (el caso que pediste explícitamente).
- Backend: test de `CreateOrganization` (transacción crea org + member owner)
  y `CreateSpace` (colisión de slug → 409).
- Frontend: flujo manual — usuario A se registra, ve onboarding (0 orgs),
  crea "Org A", crea un espacio → usuario B (otra cuenta) se registra, ve
  onboarding también (0 orgs, nunca ve la Org A) → confirma el aislamiento
  por usuario en la UI, no solo en la API.
