# Asking Questions

The chat is where loaded knowledge becomes answers. Select a project in
the right sidebar and ask away — this page covers the controls that shape
the answer.

## Conversation modes

Pick the mode that matches your task; it changes how the assistant uses
the retrieved context:

| Mode (UI) | Use it to… |
|---|---|
| Consulta general | Ask open questions over the project's knowledge |
| Explicar proceso | Walk through how a process works |
| Diseñar requerimiento | Draft a requirement against existing business rules |
| Resumen | Summarize loaded material |
| Explicar reglas | Surface and explain the applicable rules |
| Detectar contradicciones | Find conflicts between sources or with a proposal |
| Criterios de aceptación | Draft acceptance criteria for a requirement |

## Model selection

Next to the mode selector you can pick the model per message, from every
provider your organization has available: **Gemini** (Flash / Flash Lite
/ Pro), **OpenAI** (GPT-4o mini / GPT-4o), **Anthropic** (Claude Haiku /
Sonnet / Opus) or **local Ollama models** — the model you pick determines
the provider that answers.

## Citations — trust, but verify

Every grounded answer shows a *fuentes* toggle underneath. Expand it to
see each cited document with the exact fragment that grounded the answer.
Citations are saved with the message, so they remain identical when you
revisit the conversation later.

**An answer without citations means no relevant knowledge was found** —
per the product's principles, the assistant acknowledges missing
information rather than inventing it. That is your cue to load the
missing source.

## Chat history

Each project keeps your conversations, listed under the active project in
the right sidebar:

- **+ Nuevo chat** starts a fresh thread (useful to keep topics separate —
  retrieval quality benefits from focused conversations).
- Click any conversation to switch; the active one is highlighted.
- Titles are auto-generated from your first message.
- History is **private per user**: teammates in the same project never
  see your threads.

## Practical tips

- Ask one thing at a time; the retriever fetches context per question.
- Name the process/module/rule you are asking about — specific questions
  retrieve better fragments than broad ones.
- Use *Detectar contradicciones* before finalizing a requirement; it is
  the cheapest review you will ever run.
