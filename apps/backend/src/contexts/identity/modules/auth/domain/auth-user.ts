/** User as seen from the auth module (no sensitive data). */
export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
}

/** Thrown on registration when the email already has an account. */
export class EmailAlreadyInUseError extends Error {
  constructor() {
    super('El email ya está registrado');
    this.name = 'EmailAlreadyInUseError';
  }
}

/** Thrown on login when the email/password pair does not match. */
export class InvalidCredentialsError extends Error {
  constructor() {
    super('Email o contraseña incorrectos');
    this.name = 'InvalidCredentialsError';
  }
}
