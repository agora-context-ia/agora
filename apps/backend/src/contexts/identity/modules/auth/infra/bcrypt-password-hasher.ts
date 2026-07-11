import bcrypt from 'bcryptjs';
import type { PasswordHasherPort } from '../ports/password-hasher.port';

const SALT_ROUNDS = 12;

/** bcrypt implementation of the password hasher port. */
export class BcryptPasswordHasher implements PasswordHasherPort {
  hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, SALT_ROUNDS);
  }

  compare(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }
}
