import type {
  AiProvider,
  ProviderCredentialSummary,
} from '../../../src/contexts/identity/modules/ai-credentials/domain/ai-provider-credential';
import type {
  AiCredentialRepositoryPort,
  UpsertCredentialData,
} from '../../../src/contexts/identity/modules/ai-credentials/ports/ai-credential-repository.port';
import type { CredentialCipherPort } from '../../../src/contexts/identity/modules/ai-credentials/ports/credential-cipher.port';
import type {
  OrganizationMemberRole,
  OrganizationRolePort,
} from '../../../src/contexts/identity/modules/ai-credentials/ports/organization-role.port';

export class FakeOrganizationRoleAdapter implements OrganizationRolePort {
  // key: `${userId}:${organizationId}`
  private readonly roles = new Map<string, OrganizationMemberRole>();

  setRole(userId: string, organizationId: string, role: OrganizationMemberRole): void {
    this.roles.set(`${userId}:${organizationId}`, role);
  }

  async getRole(userId: string, organizationId: string): Promise<OrganizationMemberRole | null> {
    return this.roles.get(`${userId}:${organizationId}`) ?? null;
  }
}

interface StoredCredential extends UpsertCredentialData {
  updatedAt: Date;
}

export class FakeAiCredentialRepository implements AiCredentialRepositoryPort {
  readonly stored: StoredCredential[] = [];

  async upsert(data: UpsertCredentialData): Promise<ProviderCredentialSummary> {
    const existing = this.stored.findIndex(
      (row) => row.organizationId === data.organizationId && row.provider === data.provider,
    );
    const record: StoredCredential = { ...data, updatedAt: new Date() };
    if (existing >= 0) this.stored[existing] = record;
    else this.stored.push(record);

    return {
      provider: record.provider,
      apiKeyLastFour: record.apiKeyLastFour,
      updatedAt: record.updatedAt,
    };
  }

  async listByOrganization(organizationId: string): Promise<ProviderCredentialSummary[]> {
    return this.stored
      .filter((row) => row.organizationId === organizationId)
      .map((row) => ({
        provider: row.provider,
        apiKeyLastFour: row.apiKeyLastFour,
        updatedAt: row.updatedAt,
      }));
  }

  async findEncryptedKey(organizationId: string, provider: AiProvider): Promise<string | null> {
    const row = this.stored.find(
      (item) => item.organizationId === organizationId && item.provider === provider,
    );
    return row?.apiKeyEncrypted ?? null;
  }
}

// Cifrado reversible trivial para tests de use-cases (el cifrado real se
// testea aparte en aes-credential-cipher.test.ts).
export class FakeCredentialCipher implements CredentialCipherPort {
  encrypt(plainText: string): string {
    return `enc(${plainText})`;
  }

  decrypt(payload: string): string {
    return payload.slice(4, -1);
  }
}
