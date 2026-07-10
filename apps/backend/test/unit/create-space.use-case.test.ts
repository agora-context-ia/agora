import { describe, expect, it } from 'vitest';
import {
  NotOrganizationMemberError,
  SpaceSlugTakenError,
  type Space,
} from '../../src/contexts/knowledge-management/modules/projects/domain/space';
import type { OrganizationMembershipPort } from '../../src/contexts/knowledge-management/modules/projects/ports/organization-membership.port';
import type {
  CreateSpaceData,
  SpaceRepositoryPort,
} from '../../src/contexts/knowledge-management/modules/projects/ports/space-repository.port';
import { CreateSpaceUseCase } from '../../src/contexts/knowledge-management/modules/projects/use-cases/create-space/create-space.use-case';
import { ListSpacesByOrganizationUseCase } from '../../src/contexts/knowledge-management/modules/projects/use-cases/list-spaces-by-organization/list-spaces-by-organization.use-case';

class FakeSpaceRepository implements SpaceRepositoryPort {
  readonly spaces: Space[] = [];
  private sequence = 1;

  seed(organizationId: string, name: string, slug: string): Space {
    const space: Space = {
      id: `space-${this.sequence++}`,
      organizationId,
      name,
      slug,
      description: null,
      documentCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.spaces.push(space);
    return space;
  }

  async listByOrganization(organizationId: string): Promise<Space[]> {
    return this.spaces.filter((space) => space.organizationId === organizationId);
  }

  async create(data: CreateSpaceData): Promise<Space> {
    if (await this.slugExists(data.organizationId, data.slug)) {
      throw new SpaceSlugTakenError(data.slug);
    }
    const space = this.seed(data.organizationId, data.name, data.slug);
    space.description = data.description;
    return space;
  }

  async slugExists(organizationId: string, slug: string): Promise<boolean> {
    return this.spaces.some(
      (space) => space.organizationId === organizationId && space.slug === slug,
    );
  }
}

class FakeMembership implements OrganizationMembershipPort {
  constructor(private readonly memberships: Array<[string, string]>) {}

  async isMember(userId: string, organizationId: string): Promise<boolean> {
    return this.memberships.some(([u, o]) => u === userId && o === organizationId);
  }
}

describe('CreateSpaceUseCase', () => {
  it('crea el espacio con slug generado desde el nombre', async () => {
    const repo = new FakeSpaceRepository();
    const useCase = new CreateSpaceUseCase(repo, new FakeMembership([['user-1', 'org-1']]));

    const space = await useCase.execute({
      userId: 'user-1',
      organizationId: 'org-1',
      name: 'Sistema de Facturación',
      description: '  Docs del módulo  ',
    });

    expect(space.slug).toBe('sistema-de-facturacion');
    expect(space.description).toBe('Docs del módulo');
  });

  it('rechaza con NotOrganizationMemberError si el usuario no es miembro', async () => {
    const repo = new FakeSpaceRepository();
    const useCase = new CreateSpaceUseCase(repo, new FakeMembership([]));

    await expect(
      useCase.execute({ userId: 'user-1', organizationId: 'org-1', name: 'Espacio' }),
    ).rejects.toBeInstanceOf(NotOrganizationMemberError);
    expect(repo.spaces).toHaveLength(0);
  });

  it('rechaza con SpaceSlugTakenError si el slug ya existe en la organización', async () => {
    const repo = new FakeSpaceRepository();
    repo.seed('org-1', 'Facturación', 'facturacion');
    const useCase = new CreateSpaceUseCase(repo, new FakeMembership([['user-1', 'org-1']]));

    await expect(
      useCase.execute({ userId: 'user-1', organizationId: 'org-1', name: 'Facturación' }),
    ).rejects.toBeInstanceOf(SpaceSlugTakenError);
  });

  it('permite el mismo slug en organizaciones distintas', async () => {
    const repo = new FakeSpaceRepository();
    repo.seed('org-1', 'Facturación', 'facturacion');
    const useCase = new CreateSpaceUseCase(repo, new FakeMembership([['user-1', 'org-2']]));

    const space = await useCase.execute({
      userId: 'user-1',
      organizationId: 'org-2',
      name: 'Facturación',
    });
    expect(space.slug).toBe('facturacion');
  });
});

describe('ListSpacesByOrganizationUseCase', () => {
  it('devuelve los espacios de la organización solo si el usuario es miembro', async () => {
    const repo = new FakeSpaceRepository();
    repo.seed('org-1', 'Espacio A', 'espacio-a');
    repo.seed('org-2', 'Espacio B', 'espacio-b');

    const useCase = new ListSpacesByOrganizationUseCase(
      repo,
      new FakeMembership([['user-1', 'org-1']]),
    );

    const spaces = await useCase.execute('user-1', 'org-1');
    expect(spaces.map((space) => space.slug)).toEqual(['espacio-a']);

    await expect(useCase.execute('user-1', 'org-2')).rejects.toBeInstanceOf(
      NotOrganizationMemberError,
    );
  });
});
