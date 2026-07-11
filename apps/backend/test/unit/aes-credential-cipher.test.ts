import { describe, expect, it } from 'vitest';
import { AesCredentialCipher } from '../../src/contexts/identity/modules/ai-credentials/infra/aes-credential-cipher';

const KEY = 'a'.repeat(64); // 32 bytes en hex

describe('AesCredentialCipher', () => {
  it('encrypt/decrypt es un roundtrip y lo guardado no es el texto plano', () => {
    const cipher = new AesCredentialCipher(KEY);
    const plain = 'AIzaSy-super-secreta-1234';

    const encrypted = cipher.encrypt(plain);

    expect(encrypted).not.toBe(plain);
    expect(encrypted).not.toContain(plain);
    expect(cipher.decrypt(encrypted)).toBe(plain);
  });

  it('usa IV aleatorio: cifrar dos veces el mismo texto da payloads distintos', () => {
    const cipher = new AesCredentialCipher(KEY);
    expect(cipher.encrypt('misma-key')).not.toBe(cipher.encrypt('misma-key'));
  });

  it('falla al descifrar un payload manipulado (tag GCM)', () => {
    const cipher = new AesCredentialCipher(KEY);
    const [iv, tag] = cipher.encrypt('secreto').split(':');
    const tampered = `${iv}:${tag}:${Buffer.from('otra-cosa').toString('base64')}`;

    expect(() => cipher.decrypt(tampered)).toThrow();
  });

  it('rechaza claves que no sean 32 bytes en hex', () => {
    expect(() => new AesCredentialCipher('')).toThrow(/CREDENTIALS_ENCRYPTION_KEY/);
    expect(() => new AesCredentialCipher('abc123')).toThrow(/CREDENTIALS_ENCRYPTION_KEY/);
  });
});
