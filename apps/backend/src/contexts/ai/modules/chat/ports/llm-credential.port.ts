/**
 * Resolves the provider API key for an organization. The decrypted key
 * lives server-side only: it never travels over HTTP.
 */
export interface LlmCredentialPort {
  /** Returns the key to use, or null when the provider is not configured. */
  getApiKey(organizationId: string, provider: string): Promise<string | null>;
}
