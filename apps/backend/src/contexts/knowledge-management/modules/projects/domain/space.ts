/** A knowledge space ("project" in the UI) inside an organization. */
export interface Space {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  description: string | null;
  documentCount: number;
  createdAt: Date;
  updatedAt: Date;
}

/** Thrown when the requesting user does not belong to the organization. */
export class NotOrganizationMemberError extends Error {
  constructor() {
    super('No sos miembro de esta organización');
    this.name = 'NotOrganizationMemberError';
  }
}

/** Thrown when the space slug already exists within the organization. */
export class SpaceSlugTakenError extends Error {
  constructor(slug: string) {
    super(`Ya existe un espacio con el nombre/slug "${slug}" en esta organización`);
    this.name = 'SpaceSlugTakenError';
  }
}
