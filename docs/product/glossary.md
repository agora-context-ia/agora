# Glossary

Shared vocabulary for the product and this documentation. Where the UI and
the codebase use different words on purpose, both are noted.

### Organization

The multi-tenant boundary. Members, projects, AI credentials, and all
knowledge belong to exactly one organization. Nothing crosses this
boundary — not documents, not conversations, not configuration.

### Project / Space

A container of knowledge inside an organization: its sources and its
conversations. **The UI says "project" (user language); the backend and
database say "space" (domain language).** This split is intentional — see
the naming glossary in [AGENTS.md](../../AGENTS.md).

### Knowledge Source

A file uploaded into a project (PDF, DOCX, TXT, MD, CSV, JSON) that Ágora
processes into queryable context. "Source" is the user-facing word for
what the pipeline ingests.

### Document

The processed representation of a knowledge source: extracted text, split
into chunks, embedded, and classified. One source produces one document
plus its derived data (chunks, embeddings).

### Business Rule

A constraint or policy the organization operates under, captured inside
loaded sources. Ágora surfaces business rules when designing requirements
or detecting contradictions; it does not (yet) model them as first-class
records. <!-- TODO: revisit when/if business rules become structured entities -->

### Decision

An organizational decision captured in a loaded source (typically a
meeting minute or decision record). Queryable like any other context.
Recording decisions with their context is also practiced internally via
[ADRs](../architecture/decisions/).

### Meeting Minute

A record of what was discussed and decided in a meeting, uploaded as a
knowledge source so that decisions stop depending on who attended.

### Traceability

The property that an answer can be followed back to the concrete sources
that produced it. A core product principle (see
[principles.md](principles.md)) — persisted with every assistant reply,
not reconstructed after the fact.

### Citation

The visible form of traceability: the list of sources (document name +
relevant fragment + relevance score) attached to an assistant reply in
the chat.

### AI Provider

The external or local model service Ágora uses for embeddings and chat
generation (chat: Gemini, OpenAI, Anthropic or local Ollama; embeddings:
Ollama or Gemini). Interchangeable by design — see
[ai-providers.md](../architecture/ai-providers.md).
