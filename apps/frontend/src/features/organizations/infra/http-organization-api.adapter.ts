import type { OrganizationDto } from '@contexthub-ai/shared-types';
import { apiFetch } from '@/lib/api';
import type { Organization } from '../domain/organization';
import type { CreateOrganizationInput, OrganizationApiPort } from '../ports/organization-api.port';

function toOrganization(dto: OrganizationDto): Organization {
  return { id: dto.id, name: dto.name, slug: dto.slug, role: dto.role };
}

class HttpOrganizationApiAdapter implements OrganizationApiPort {
  async list(): Promise<Organization[]> {
    const body = await apiFetch<{ organizations: OrganizationDto[] }>('/api/organizations');
    return body.organizations.map(toOrganization);
  }

  async create(input: CreateOrganizationInput): Promise<Organization> {
    const body = await apiFetch<{ organization: OrganizationDto }>('/api/organizations', {
      method: 'POST',
      body: JSON.stringify({ name: input.name }),
    });
    return toOrganization(body.organization);
  }
}

export const organizationApiAdapter = new HttpOrganizationApiAdapter();
