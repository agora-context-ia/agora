import { describe, expect, it } from 'vitest';
import {
  InvalidApiKeyError,
  KeylessProviderError,
  NotOrganizationAdminError,
  NotOrganizationMemberError,
  UnknownAiProviderError,
} from '../../src/contexts/identity/modules/ai-credentials/domain/ai-provider-credential';
import { AI_PROVIDERS } from '../../src/shared/ai-provider-catalog';
import { SaveProviderCredentialUseCase } from '../../src/contexts/identity/modules/ai-credentials/use-cases/save-provider-credential/save-provider-credential.use-case';
import { ListProviderCredentialsUseCase } from '../../src/contexts/identity/modules/ai-credentials/use-cases/list-provider-credentials/list-provider-credentials.use-case';
import {
  FakeAiCredentialRepository,
  FakeCredentialCipher,
  FakeOrganizationRoleAdapter,
} from './fakes/fake-ai-credentials-module';

const API_KEY = 'AIzaSy-test-key-1234-8f21';

function setup() {
  const roles = new FakeOrganizationRoleAdapter();
  const repo = new FakeAiCredentialRepository();
  const cipher = new FakeCredentialCipher();
  const save = new SaveProviderCredentialUseCase(roles, repo, cipher);
  const list = new ListProviderCredentialsUseCase(roles, repo);
  return { roles, repo, save, list };
}

describe('SaveProviderCredentialUseCase', () => {
  it('guarda la key cifrada cuando el usuario es owner', async () => {
    const { roles, repo, save } = setup();
    roles.setRole('user-1', 'org-1', 'owner');

    const result = await save.execute({
      userId: 'user-1',
      organizationId: 'org-1',
      provider: 'gemini',
      apiKey: API_KEY,
    });

    expect(result.apiKeyLastFour).toBe('8f21');
    expect(repo.stored).toHaveLength(1);
    // Lo persistido nunca es el texto plano.
    expect(repo.stored[0].apiKeyEncrypted).not.toBe(API_KEY);
    expect(repo.stored[0].apiKeyEncrypted).toContain('enc(');
  });

  it('permite guardar a un admin', async () => {
    const { roles, save } = setup();
    roles.setRole('user-1', 'org-1', 'admin');

    await expect(
      save.execute({ userId: 'user-1', organizationId: 'org-1', provider: 'gemini', apiKey: API_KEY }),
    ).resolves.toMatchObject({ provider: 'gemini' });
  });

  it('rechaza a un member con NotOrganizationAdminError (403)', async () => {
    const { roles, repo, save } = setup();
    roles.setRole('user-1', 'org-1', 'member');

    await expect(
      save.execute({ userId: 'user-1', organizationId: 'org-1', provider: 'gemini', apiKey: API_KEY }),
    ).rejects.toBeInstanceOf(NotOrganizationAdminError);
    expect(repo.stored).toHaveLength(0);
  });

  it('rechaza a un no-miembro con NotOrganizationMemberError', async () => {
    const { save } = setup();

    await expect(
      save.execute({ userId: 'user-1', organizationId: 'org-1', provider: 'gemini', apiKey: API_KEY }),
    ).rejects.toBeInstanceOf(NotOrganizationMemberError);
  });

  it('rechaza proveedores desconocidos y keys demasiado cortas', async () => {
    const { roles, save } = setup();
    roles.setRole('user-1', 'org-1', 'owner');

    await expect(
      save.execute({ userId: 'user-1', organizationId: 'org-1', provider: 'mistral', apiKey: API_KEY }),
    ).rejects.toBeInstanceOf(UnknownAiProviderError);

    await expect(
      save.execute({ userId: 'user-1', organizationId: 'org-1', provider: 'gemini', apiKey: 'corta' }),
    ).rejects.toBeInstanceOf(InvalidApiKeyError);
  });

  it('rechaza guardar una key para un proveedor keyless (ollama)', async () => {
    const { roles, repo, save } = setup();
    roles.setRole('user-1', 'org-1', 'owner');

    await expect(
      save.execute({ userId: 'user-1', organizationId: 'org-1', provider: 'ollama', apiKey: API_KEY }),
    ).rejects.toBeInstanceOf(KeylessProviderError);
    expect(repo.stored).toHaveLength(0);
  });
});

describe('ListProviderCredentialsUseCase', () => {
  it('cualquier member ve el estado, pero nunca la key (ni cifrada)', async () => {
    const { roles, save, list } = setup();
    roles.setRole('admin-1', 'org-1', 'admin');
    roles.setRole('member-1', 'org-1', 'member');
    await save.execute({ userId: 'admin-1', organizationId: 'org-1', provider: 'gemini', apiKey: API_KEY });

    const providers = await list.execute('member-1', 'org-1');

    expect(providers).toHaveLength(AI_PROVIDERS.length);
    const gemini = providers.find((setting) => setting.provider === 'gemini');
    expect(gemini).toMatchObject({
      configured: true,
      requiresApiKey: true,
      apiKeyLastFour: '8f21',
    });
    expect(gemini!.models.length).toBeGreaterThan(0);
    // Ninguna forma de la key sale del use-case.
    const serialized = JSON.stringify(providers);
    expect(serialized).not.toContain(API_KEY);
    expect(serialized).not.toContain('enc(');
  });

  it('devuelve el proveedor como no configurado cuando no hay key', async () => {
    const { roles, list } = setup();
    roles.setRole('member-1', 'org-1', 'member');

    const providers = await list.execute('member-1', 'org-1');

    const gemini = providers.find((setting) => setting.provider === 'gemini');
    expect(gemini).toMatchObject({ configured: false, apiKeyLastFour: null });
  });

  it('marca a los proveedores keyless como configurados sin credencial', async () => {
    const { roles, list } = setup();
    roles.setRole('member-1', 'org-1', 'member');

    const providers = await list.execute('member-1', 'org-1');

    const ollama = providers.find((setting) => setting.provider === 'ollama');
    expect(ollama).toMatchObject({
      requiresApiKey: false,
      configured: true,
      apiKeyLastFour: null,
    });
  });

  it('rechaza a un no-miembro', async () => {
    const { list } = setup();
    await expect(list.execute('user-x', 'org-1')).rejects.toBeInstanceOf(
      NotOrganizationMemberError,
    );
  });
});
