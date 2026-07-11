/** User row including the password hash — never leaves the auth module. */
export interface UserRecord {
  id: string;
  email: string;
  fullName: string;
  passwordHash: string;
}

/** Data to create an account; the password arrives already hashed. */
export interface CreateUserInput {
  email: string;
  fullName: string;
  passwordHash: string;
}

/** Profile fields that can be updated. */
export interface UpdateProfileData {
  fullName: string;
}

/** Persistence contract for user accounts. */
export interface UserRepositoryPort {
  findByEmail(email: string): Promise<UserRecord | null>;
  findById(id: string): Promise<UserRecord | null>;
  create(input: CreateUserInput): Promise<UserRecord>;
  registerLogin(userId: string): Promise<void>;
  updateProfile(userId: string, data: UpdateProfileData): Promise<UserRecord>;
}
