import type { SpaceDto } from '@contexthub-ai/shared-types';
import { apiFetch } from '@/lib/api';
import type { Project } from '../domain/project';
import type { CreateProjectInput, ProjectApiPort } from '../ports/project-api.port';

// En el backend los "proyectos" son spaces dentro de una organización.
function toProject(dto: SpaceDto): Project {
  return {
    id: dto.id,
    organizationId: dto.organizationId,
    name: dto.name,
    description: dto.description ?? '',
    docCount: dto.documentCount,
    updatedAt: dto.updatedAt,
  };
}

class HttpProjectApiAdapter implements ProjectApiPort {
  async list(organizationId: string): Promise<Project[]> {
    const body = await apiFetch<{ spaces: SpaceDto[] }>(
      `/api/organizations/${organizationId}/spaces`,
    );
    return body.spaces.map(toProject);
  }

  async create(input: CreateProjectInput): Promise<Project> {
    const body = await apiFetch<{ space: SpaceDto }>(
      `/api/organizations/${input.organizationId}/spaces`,
      {
        method: 'POST',
        body: JSON.stringify({ name: input.name, description: input.description }),
      },
    );
    return toProject(body.space);
  }
}

export const projectApiAdapter = new HttpProjectApiAdapter();
