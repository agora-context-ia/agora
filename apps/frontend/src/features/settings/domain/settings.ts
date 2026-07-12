// AI configuration of the active organization, as seen by the frontend.
// The API key never arrives complete: only apiKeyLastFour.

export interface AiModelOption {
  value: string;
  label: string;
}

/** State of one AI provider: catalog models plus configuration status. */
export interface AiProviderSetting {
  provider: string;
  label: string;
  /** false for self-hosted providers (e.g. Ollama local): no key to configure. */
  requiresApiKey: boolean;
  models: AiModelOption[];
  configured: boolean;
  apiKeyLastFour: string | null;
  updatedAt: string | null;
}
