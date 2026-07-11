/** Password hashing contract (bcrypt in production, fast fakes in tests). */
export interface PasswordHasherPort {
  hash(plain: string): Promise<string>;
  compare(plain: string, hash: string): Promise<boolean>;
}
