// Resuelve la API key del proveedor para una organización. La key
// descifrada solo vive server-side: nunca sale por HTTP.
export interface LlmCredentialPort {
  getApiKey(organizationId: string, provider: string): Promise<string | null>;
}
