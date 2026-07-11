import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import type { CredentialCipherPort } from '../ports/credential-cipher.port';

// AES-256-GCM con clave de servidor (CREDENTIALS_ENCRYPTION_KEY, 32 bytes
// hex). El payload guardado es `iv:tag:ciphertext` en base64: el IV es
// aleatorio por operación y el tag GCM autentica el contenido (un payload
// manipulado falla al descifrar en vez de devolver basura).
const IV_LENGTH = 12;

export class AesCredentialCipher implements CredentialCipherPort {
  private readonly key: Buffer;

  constructor(hexKey: string) {
    if (!/^[0-9a-fA-F]{64}$/.test(hexKey)) {
      throw new Error(
        'CREDENTIALS_ENCRYPTION_KEY debe ser 32 bytes en hex. Generar con: openssl rand -hex 32',
      );
    }
    this.key = Buffer.from(hexKey, 'hex');
  }

  encrypt(plainText: string): string {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv('aes-256-gcm', this.key, iv);
    const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
  }

  decrypt(payload: string): string {
    const [iv, tag, data] = payload.split(':');
    if (!iv || !tag || !data) {
      throw new Error('Payload cifrado inválido: se esperaba iv:tag:ciphertext');
    }
    const decipher = createDecipheriv('aes-256-gcm', this.key, Buffer.from(iv, 'base64'));
    decipher.setAuthTag(Buffer.from(tag, 'base64'));
    return Buffer.concat([decipher.update(Buffer.from(data, 'base64')), decipher.final()]).toString(
      'utf8',
    );
  }
}
