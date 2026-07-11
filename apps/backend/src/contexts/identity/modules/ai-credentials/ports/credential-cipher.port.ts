/** Symmetric encryption contract for secrets stored at rest. */
export interface CredentialCipherPort {
  encrypt(plainText: string): string;
  /** @throws Error when the payload is malformed or fails authentication. */
  decrypt(payload: string): string;
}
