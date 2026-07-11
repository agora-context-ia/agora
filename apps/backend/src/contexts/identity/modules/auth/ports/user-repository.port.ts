export interface UserRecord {
  id: string;
  email: string;
  fullName: string;
  passwordHash: string;
}

export interface CreateUserInput {
  email: string;
  fullName: string;
  passwordHash: string;
}

export interface UpdateProfileData {
  fullName: string;
}

export interface UserRepositoryPort {
  findByEmail(email: string): Promise<UserRecord | null>;
  findById(id: string): Promise<UserRecord | null>;
  create(input: CreateUserInput): Promise<UserRecord>;
  registerLogin(userId: string): Promise<void>;
  updateProfile(userId: string, data: UpdateProfileData): Promise<UserRecord>;
}
