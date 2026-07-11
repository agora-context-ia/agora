/**
 * Shared kernel: catalog of supported AI providers and their chat models.
 *
 * Owned by no single context on purpose — `identity/ai-credentials` uses it
 * to validate which providers can store an API key, and `ai/chat` uses it to
 * resolve the provider behind a requested model. Pure static data: keep it
 * free of I/O and state.
 *
 * The catalog is hardcoded for now. If it grows, move it to a table in the
 * `parameters` schema.
 */

export const AI_PROVIDERS = ['gemini'] as const;

/** Identifier of a supported AI provider (e.g. `gemini`). */
export type AiProvider = (typeof AI_PROVIDERS)[number];

/** A selectable chat model: `value` is the provider's model id, `label` the UI text. */
export interface AiModelOption {
  value: string;
  label: string;
}

/**
 * Models offered per provider.
 *
 * Google's rolling `-latest` aliases are used instead of versioned names
 * (e.g. `gemini-2.5-flash`): versioned models get retired for new accounts
 * (they already return 404) and would break the chat on every generation
 * change, while the aliases always point to the latest stable version.
 */
export const AI_PROVIDER_CATALOG: Record<AiProvider, { label: string; models: AiModelOption[] }> = {
  gemini: {
    label: 'Google Gemini',
    models: [
      { value: 'gemini-flash-latest', label: 'Gemini Flash (rápido)' },
      { value: 'gemini-flash-lite-latest', label: 'Gemini Flash Lite (más económico)' },
      { value: 'gemini-pro-latest', label: 'Gemini Pro (más capaz)' },
    ],
  },
};

/** Type guard narrowing an arbitrary string to a supported {@link AiProvider}. */
export function isAiProvider(value: string): value is AiProvider {
  return (AI_PROVIDERS as readonly string[]).includes(value);
}
