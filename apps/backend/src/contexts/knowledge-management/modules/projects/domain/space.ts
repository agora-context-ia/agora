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

export class NotOrganizationMemberError extends Error {
  constructor() {
    super('No sos miembro de esta organización');
    this.name = 'NotOrganizationMemberError';
  }
}

export class SpaceSlugTakenError extends Error {
  constructor(slug: string) {
    super(`Ya existe un espacio con el nombre/slug "${slug}" en esta organización`);
    this.name = 'SpaceSlugTakenError';
  }
}
