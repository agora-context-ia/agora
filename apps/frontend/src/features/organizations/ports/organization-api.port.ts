import type { Organization } from '../domain/organization';

/** Payload to create an organization. */
export interface CreateOrganizationInput {
  name: string;
}

/** API client contract for the organizations feature. */
export interface OrganizationApiPort {
  list(): Promise<Organization[]>;
  create(input: CreateOrganizationInput): Promise<Organization>;
}
