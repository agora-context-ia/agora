import { describe, expect, it } from 'vitest';
import { ListMyOrganizationsUseCase } from '../../src/contexts/identity/modules/organizations/use-cases/list-my-organizations/list-my-organizations.use-case';
import { FakeOrganizationRepository } from './fakes/fake-organization.repository';

describe('ListMyOrganizationsUseCase', () => {
  it('cada usuario ve solo las organizaciones donde es miembro', async () => {
    const repo = new FakeOrganizationRepository();
    repo.seed('Org de Ana', 'org-de-ana', 'user-ana');
    repo.seed('Org de Beto', 'org-de-beto', 'user-beto');

    const useCase = new ListMyOrganizationsUseCase(repo);

    const deAna = await useCase.execute('user-ana');
    const deBeto = await useCase.execute('user-beto');

    expect(deAna).toHaveLength(1);
    expect(deAna[0].slug).toBe('org-de-ana');
    expect(deBeto).toHaveLength(1);
    expect(deBeto[0].slug).toBe('org-de-beto');
  });

  it('un usuario sin membresías recibe lista vacía aunque existan organizaciones', async () => {
    const repo = new FakeOrganizationRepository();
    repo.seed('Org ajena', 'org-ajena', 'user-otro');

    const useCase = new ListMyOrganizationsUseCase(repo);

    expect(await useCase.execute('user-nuevo')).toEqual([]);
  });

  it('incluye organizaciones donde el usuario es member invitado, con su rol', async () => {
    const repo = new FakeOrganizationRepository();
    const org = repo.seed('Org compartida', 'org-compartida', 'user-owner');
    repo.addMember(org.id, 'user-invitado', 'member');

    const useCase = new ListMyOrganizationsUseCase(repo);
    const result = await useCase.execute('user-invitado');

    expect(result).toHaveLength(1);
    expect(result[0].role).toBe('member');
  });
});
