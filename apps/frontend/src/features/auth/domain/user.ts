/** Authenticated user as exposed to the UI. */
export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}
