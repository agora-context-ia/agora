export interface CredentialCipherPort {
  encrypt(plainText: string): string;
  decrypt(payload: string): string;
}
