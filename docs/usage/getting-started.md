# Getting Started

From zero to your first grounded answer. Assumes Ágora is already running
(see [installation](../deployment/installation.md)) — the UI itself is in
Spanish, the product's language.

## 1. Create your account

Open the app, click **Regístrate**, and sign up with your name, email and
password (minimum 8 characters). You are logged in immediately.

## 2. Create your organization

On first login Ágora asks you to create an organization — everything
(projects, members, AI credentials) lives inside one. Give it a name and
continue.

## 3. Connect the AI provider

Open **Configuración** in the left sidebar and add your organization's
API key for the provider you want (Gemini, OpenAI or Anthropic) — or use
the local **Ollama** provider, which needs no key (see
[AI provider setup](../deployment/ai-provider-setup.md)). Without at
least one available provider, uploads and search work, but chat answers
cannot be generated.

## 4. Create a project

In the right sidebar, click **Nuevo proyecto** and name it. A project
groups the knowledge sources and conversations of one initiative, system,
or team.

## 5. Upload knowledge

Open the project menu (⋮) → **Ver fuentes**, then drag a document in
(PDF, DOCX, TXT, MD, CSV or JSON, up to 20 MB), pick a classification and
upload. Processing runs in the background — the status updates live.
Details in [uploading-knowledge.md](uploading-knowledge.md).

## 6. Ask your first question

Back in the main view, select the project, pick a conversation mode
(start with **Consulta general**) and ask something your document
answers. The reply arrives with **citations** — expand *fuentes* under
the answer to see exactly which fragments grounded it.

## Where to go next

- [asking-questions.md](asking-questions.md) — modes, models, chat history.
- [organizing-projects.md](organizing-projects.md) — structuring orgs and projects.
