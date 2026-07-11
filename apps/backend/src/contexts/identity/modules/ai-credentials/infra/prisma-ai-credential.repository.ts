import { prisma } from '../../../../../infrastructure/persistence/prisma-client';
import type { AiProvider } from '../../../../../shared/ai-provider-catalog';
import type { ProviderCredentialSummary } from '../domain/ai-provider-credential';
import type {
  AiCredentialRepositoryPort,
  UpsertCredentialData,
} from '../ports/ai-credential-repository.port';

/** Prisma-backed store for encrypted AI provider credentials (one per org+provider). */
export class PrismaAiCredentialRepository implements AiCredentialRepositoryPort {
  async upsert(data: UpsertCredentialData): Promise<ProviderCredentialSummary> {
    const row = await prisma.aiProviderCredential.upsert({
      where: {
        organizationId_provider: {
          organizationId: data.organizationId,
          provider: data.provider,
        },
      },
      create: {
        organizationId: data.organizationId,
        provider: data.provider,
        apiKeyEncrypted: data.apiKeyEncrypted,
        apiKeyLastFour: data.apiKeyLastFour,
        createdBy: data.createdBy,
      },
      // Key replacement: createdBy becomes the last admin who stored it,
      // and a soft-deleted credential is revived.
      update: {
        apiKeyEncrypted: data.apiKeyEncrypted,
        apiKeyLastFour: data.apiKeyLastFour,
        createdBy: data.createdBy,
        status: true,
        deletedAt: null,
      },
    });

    return {
      provider: row.provider as AiProvider,
      apiKeyLastFour: row.apiKeyLastFour,
      updatedAt: row.updatedAt,
    };
  }

  async listByOrganization(organizationId: string): Promise<ProviderCredentialSummary[]> {
    const rows = await prisma.aiProviderCredential.findMany({
      where: { organizationId, status: true, deletedAt: null },
      orderBy: { provider: 'asc' },
    });

    return rows.map((row) => ({
      provider: row.provider as AiProvider,
      apiKeyLastFour: row.apiKeyLastFour,
      updatedAt: row.updatedAt,
    }));
  }

  async findEncryptedKey(organizationId: string, provider: AiProvider): Promise<string | null> {
    const row = await prisma.aiProviderCredential.findFirst({
      where: { organizationId, provider, status: true, deletedAt: null },
      select: { apiKeyEncrypted: true },
    });
    return row?.apiKeyEncrypted ?? null;
  }
}
