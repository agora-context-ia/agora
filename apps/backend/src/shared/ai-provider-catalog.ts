/**
 * Shared kernel: catalog of supported AI providers and their chat models.
 *
 * Owned by no single context on purpose — `identity/ai-credentials` uses it
 * to validate which providers can store an API key, and `ai/chat` uses it to
 * resolve the provider behind a requested model. Static data resolved once
 * at boot: keep it free of I/O and mutable state.
 *
 * The catalog is hardcoded for now. If it grows, move it to a table in the
 * `parameters` schema.
 */

export const AI_PROVIDERS = ['gemini', 'openai', 'anthropic', 'ollama'] as const;

/** Identifier of a supported AI provider (e.g. `gemini`). */
export type AiProvider = (typeof AI_PROVIDERS)[number];

/** A selectable chat model: `value` is the provider's model id, `label` the UI text. */
export interface AiModelOption {
  value: string;
  label: string;
}

/** Catalog entry for one provider. `requiresApiKey: false` marks self-hosted providers. */
export interface AiProviderCatalogEntry {
  label: string;
  requiresApiKey: boolean;
  models: AiModelOption[];
}

/**
 * Ollama runs whatever the self-hoster pulled, so its model list is
 * configurable: OLLAMA_CHAT_MODELS is a comma-separated list of model ids.
 * Read once at module load — still static data for the process lifetime.
 */
function ollamaModelsFromEnv(): AiModelOption[] {
  const raw = process.env.OLLAMA_CHAT_MODELS ?? 'llama3.1:8b,qwen3:8b';
  return raw
    .split(',')
    .map((model) => model.trim())
    .filter(Boolean)
    .map((model) => ({ value: model, label: model }));
}

/**
 * Models offered per provider.
 *
 * Google's rolling `-latest` aliases are used instead of versioned names
 * (e.g. `gemini-2.5-flash`): versioned models get retired for new accounts
 * (they already return 404) and would break the chat on every generation
 * change, while the aliases always point to the latest stable version.
 * OpenAI and Anthropic entries use each vendor's stable aliases for the
 * same reason.
 */
export const AI_PROVIDER_CATALOG: Record<AiProvider, AiProviderCatalogEntry> = {
  gemini: {
    label: 'Google Gemini',
    requiresApiKey: true,
    models: [
      { value: 'gemini-flash-latest', label: 'Gemini Flash (rápido)' },
      { value: 'gemini-flash-lite-latest', label: 'Gemini Flash Lite (más económico)' },
      { value: 'gemini-pro-latest', label: 'Gemini Pro (más capaz)' },
    ],
  },
  openai: {
    label: 'OpenAI',
    requiresApiKey: true,
    models: [
      { value: 'gpt-4o-mini', label: 'GPT-4o mini (rápido y económico)' },
      { value: 'gpt-4o', label: 'GPT-4o (más capaz)' },
    ],
  },
  anthropic: {
    label: 'Anthropic Claude',
    requiresApiKey: true,
    models: [
      { value: 'claude-haiku-4-5', label: 'Claude Haiku 4.5 (rápido y económico)' },
      { value: 'claude-sonnet-5', label: 'Claude Sonnet 5 (equilibrado)' },
      { value: 'claude-opus-4-8', label: 'Claude Opus 4.8 (más capaz)' },
    ],
  },
  ollama: {
    label: 'Ollama (local)',
    requiresApiKey: false,
    models: ollamaModelsFromEnv(),
  },
};

/** Type guard narrowing an arbitrary string to a supported {@link AiProvider}. */
export function isAiProvider(value: string): value is AiProvider {
  return (AI_PROVIDERS as readonly string[]).includes(value);
}
