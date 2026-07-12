# 2. LLM provider abstraction: one port, one router, catalog as registry

Date: 2026-07-12

## Status

Accepted

## Context

Provider independence is part of Ágora's identity ("privacy must be a
structural capability"), yet until Phase 1 the chat only worked with
Gemini. The roadmap demands: any provider selectable via configuration,
and adding a provider reduced to implementing a single interface —
including a fully local option (Ollama) that makes free self-hosting
real.

Constraints that shaped the design:

- The hexagonal rule: use cases depend on ports, never on vendors.
- Per-organization credentials, decrypted server-side per request — an
  adapter cannot hold a global API key.
- A local provider has **no API key at all**, which the credential flow
  assumed until now.
- No vendor SDKs: the existing Gemini and Ollama adapters are plain
  `fetch` calls, and symmetric dependency-free adapters are the point of
  the abstraction.

## Decision

1. **One port.** `LlmProviderPort.generate(input)` stays the single
   contract. `LlmGenerateInput` gains `provider` (routing key) and keeps
   `apiKey` per call (empty string for keyless providers).
2. **One router.** `ProviderRoutingLlmAdapter` implements the same port
   and dispatches to a `Record<provider, LlmProviderPort>` built in the
   composition root. Use cases keep seeing exactly one LLM.
3. **Catalog as registry.** `shared/ai-provider-catalog.ts` is the single
   source of truth: which providers exist, which models each offers, and
   whether it `requiresApiKey`. The model chosen by the user resolves the
   provider; no separate "provider selector" exists.
4. **Keyless providers.** Entries with `requiresApiKey: false` (Ollama)
   skip the credential check in the chat use case, always report
   `configured: true` to the frontend, and reject key storage with a
   domain error. Ollama's model list comes from `OLLAMA_CHAT_MODELS`
   because a self-hoster runs whatever they pulled.
5. **Raw HTTP adapters.** Each provider is one `fetch`-based file in
   `ai/modules/chat/infra/` (`gemini-`, `openai-`, `anthropic-`,
   `ollama-llm.adapter.ts`), all normalizing errors to
   `LlmRequestFailedError` and token usage to `tokensInput/tokensOutput`.

**Streaming is deliberately deferred.** When the UI learns to render
tokens incrementally, the port will grow a `generateStream()` method
returning an async iterable of deltas; the router forwards it unchanged
and each adapter maps its provider's SSE/chunk format. Nothing in this
design blocks that extension — it was cut from Phase 1 because the DoD
(provider selectable via config, new provider = one interface) does not
require it and the frontend work is a feature of its own.

Alternatives considered:

- *Vendor SDKs per provider* — rejected: four heavyweight dependencies,
  asymmetric error/streaming semantics, and the community-contribution
  path ("copy an adapter file") becomes "learn a new SDK".
- *An LLM gateway service (LiteLLM et al.)* — rejected: adds an infra
  component to every self-hosted deployment and moves the org-key
  handling outside the process boundary that today guarantees keys never
  leave the backend.
- *Provider chosen by env var instead of model catalog* — rejected: orgs
  on one deployment legitimately mix providers (cloud model for some
  teams, local model for sensitive spaces); the model picker already
  expresses that per message.

## Consequences

- Adding a 5th provider = implement `LlmProviderPort` in one file, add a
  catalog entry, register it in the container router. Documented in
  [extending Ágora](../../development/extending-agora.md).
- The chat use case gained a `requiresApiKey` branch — the only place
  keyless-ness is visible outside the catalog and the settings UI.
- Model lists for cloud vendors are hardcoded aliases and will need
  occasional refresh (accepted trade-off; the catalog comment records the
  escape hatch of moving it to the `parameters` schema).
- Until streaming lands, long answers arrive all at once regardless of
  provider.
