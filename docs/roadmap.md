# Ágora Roadmap

**Strategy: complete, coherent product before public launch.** Phases run in
order **1 → 2 → 3 → 4**. Each phase has an explicit *Definition of Done*.

**Legend:** ✅ Done · 🔨 In progress · ⏳ Planned · 🔗 Has dependency

## Current state — MVP ✅

The core of Ágora already works: knowledge can be loaded and queried.

| Capability | Status |
|---|---|
| User authentication / login | ✅ Done |
| Create organizations | ✅ Done |
| Create spaces (projects) | ✅ Done |
| Gemini integration (AI provider) | ✅ Done |
| Upload documents | ✅ Done |
| Classify documents | ✅ Done |
| Chat with the LLM over loaded knowledge | ✅ Done |

The roadmap below completes the product around that core.

## Phase overview

| Phase | Theme | Why it matters | Status |
|---|---|---|---|
| **1** | Provider Independence | Completes the *identity* Ágora promises | ✅ (streaming pending) |
| **2** | Multi-user Collaboration | Completes the *value* (shared context) | ⏳ |
| **3** | Knowledge Graph | Adds *depth* and a differentiator | ⏳ |
| **4** | Open Source Readiness | Turns the repo into an *adoptable project* | ⏳ |

---

## 🧩 Phase 1 — Provider Independence *(Complete the Identity)*

Today Ágora only works with Gemini (cloud, paid). The founding document
states that **provider independence and local models are part of the
project's identity**, not an extra ("privacy must be a structural
capability"). Until local models work, Ágora is not yet what it promises
to be.

**Approach:** build the provider abstraction **once** — a clean interface
(common input/output, streaming, error handling) — then implement each LLM
as one implementation of that interface. This directly serves the
*extensibility* principle and makes the 5th provider
(community-contributed) trivial.

- [x] Design and build the **LLM Provider abstraction layer**
      ([ADR 0002](architecture/decisions/0002-llm-provider-abstraction.md))
- [x] Refactor the existing Gemini integration to use the abstraction
- [x] Add **OpenAI (ChatGPT)** provider
- [x] Add **Anthropic (Claude)** provider
- [x] Add **Ollama (self-hosted)** provider ⭐ *strategic priority — unlocks real, free self-hosting*
- [x] Provider selection via configuration (model catalog + `OLLAMA_CHAT_MODELS`)
- [ ] Token **streaming** through the abstraction to the UI *(deferred — see ADR 0002)*

**Definition of Done:** any provider is selectable via config; adding a new
provider means implementing a single interface. ✅ Met — see the guide in
[extending Ágora](development/extending-agora.md).

---

## 👥 Phase 2 — Multi-user Collaboration *(Complete the Value)*

The founding document says Ágora's greatest value appears "when several
people need to share and understand the same context." Today it is
effectively single-user. Collaboration is not an improvement — it is where
the value proposition lives.

> ⚠️ **Hidden decision to resolve first:** inviting users implies **roles
> and permissions**. Who can upload documents? Who can only ask questions?
> Admin vs member? Are permissions per-organization or also per-space?
> This design decision is the real work; the invitation flow is the easy
> part that follows.

- [ ] Design the **roles & permissions model** (org-level and space-level)
- [ ] **Email verification** (introduces a transactional email service 🔗)
- [ ] **Invite users** to an organization by email
- [ ] Accept-invitation + join-with-role flow

**Definition of Done:** an org owner can invite a user by email; the
invited user verifies their account and joins with a defined role.

---

## 🕸️ Phase 3 — Knowledge Graph *(Product Depth / Differentiator)*

A graph of relationships between loaded documents — showing not just
*what* the knowledge is, but *how it connects*. Placed after Phases 1–2
because it is a **differentiator, not a blocker**: no one refuses to adopt
Ágora for lacking it, but it is the kind of "wow" feature that demos and
the informational website well. It also reinforces the traceability thesis
(cite the source *and* show how knowledge relates).

- [ ] Extract relationships between documents
- [ ] Build the graph data model
- [ ] Visualize the knowledge graph in the UI
- [ ] Link graph nodes back to source documents (traceability)

**Definition of Done:** users can visualize how loaded documents relate to
one another.

---

## 🚀 Phase 4 — Open Source Readiness & Launch

This cluster turns an advanced repo into an *adoptable open source project*.

> 🔗 **Dependency:** the **deployment cost documentation** depends partly
> on Phase 2, because email verification introduces a transactional email
> service — exactly the kind of infrastructure cost worth documenting.
> Write that part once the email service is chosen.

- [ ] Complete `/docs` (English) 🔨 *(structure and first version in place; kept current as phases land)*
- [ ] Build the **informational website**
- [ ] Write **deployment cost documentation** (hosting, AI provider costs, email service) 🔗
- [x] Add community health files (README, LICENSE, CONTRIBUTING, CODE_OF_CONDUCT, SECURITY, CHANGELOG, issue/PR templates)

**Definition of Done:** a stranger can clone the repo, self-host it for
free using Ollama, and understand what the project is and how to
contribute.
