import { prisma } from '../../../../../infrastructure/persistence/prisma-client';
import type { AiProvider, ProviderCredentialSummary } from '../domain/ai-provider-credential';
import type {
  AiCredentialRepositoryPort,
  UpsertCredentialData,
} from '../ports/ai-credential-repository.port';

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
      // Reemplazo de key: createdBy pasa a ser el último admin que la
      // cargó, y se revive si estaba soft-deleteada.
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
