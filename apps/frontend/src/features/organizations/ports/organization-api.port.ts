import type { Organization } from '../domain/organization';

export interface CreateOrganizationInput {
  name: string;
}

export interface OrganizationApiPort {
  list(): Promise<Organization[]>;
  create(input: CreateOrganizationInput): Promise<Organization>;
}
