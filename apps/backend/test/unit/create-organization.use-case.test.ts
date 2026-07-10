import { describe, expect, it } from 'vitest';
import { CreateOrganizationUseCase } from '../../src/contexts/identity/modules/organizations/use-cases/create-organization/create-organization.use-case';
import { FakeOrganizationRepository } from './fakes/fake-organization.repository';

describe('CreateOrganizationUseCase', () => {
  it('crea la organización y deja al creador como member owner', async () => {
    const repo = new FakeOrganizationRepository();
    const useCase = new CreateOrganizationUseCase(repo);

    const result = await useCase.execute({ userId: 'user-1', name: 'Mi Empresa' });

    expect(result.slug).toBe('mi-empresa');
    expect(result.role).toBe('owner');
    expect(repo.organizations).toHaveLength(1);
    expect(repo.members).toEqual([
      { organizationId: result.id, userId: 'user-1', role: 'owner' },
    ]);
  });

  it('genera el slug desde el nombre normalizando acentos y símbolos', async () => {
    const repo = new FakeOrganizationRepository();
    const useCase = new CreateOrganizationUseCase(repo);

    const result = await useCase.execute({ userId: 'user-1', name: '  Órgano & Cía.  ' });

    expect(result.slug).toBe('organo-cia');
  });

  it('agrega sufijo incremental cuando el slug colisiona', async () => {
    const repo = new FakeOrganizationRepository();
    repo.seed('Acme', 'acme', 'user-otro');
    repo.seed('Acme 2', 'acme-2', 'user-otro');

    const useCase = new CreateOrganizationUseCase(repo);
    const result = await useCase.execute({ userId: 'user-1', name: 'Acme' });

    expect(result.slug).toBe('acme-3');
  });
});
