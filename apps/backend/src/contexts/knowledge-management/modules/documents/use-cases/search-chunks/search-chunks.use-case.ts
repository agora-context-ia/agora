import { NotOrganizationMemberError } from '../../../projects/domain/space';
import type { OrganizationMembershipPort } from '../../../projects/ports/organization-membership.port';
import { SpaceNotFoundInOrganizationError } from '../../domain/document';
import type { EmbeddingProviderPort } from '../../ports/embedding-provider.port';
import type {
  EmbeddingRepositoryPort,
  SemanticSearchHit,
} from '../../ports/embedding-repository.port';
import type { SpaceAccessPort } from '../../ports/space-access.port';

const DEFAULT_LIMIT = 8;
const MAX_LIMIT = 50;

/**
 * Semantic search inside a space. The query is embedded with the SAME
 * active provider and filtered by its model_name: vectors from different
 * models are never compared against each other.
 */
export class SearchChunksUseCase {
  constructor(
    private readonly embeddings: EmbeddingRepositoryPort,
    private readonly embeddingProvider: EmbeddingProviderPort,
    private readonly membership: OrganizationMembershipPort,
    private readonly spaceAccess: SpaceAccessPort,
  ) {}

  async execute(
    userId: string,
    organizationId: string,
    spaceId: string,
    query: string,
    limit: number = DEFAULT_LIMIT,
  ): Promise<SemanticSearchHit[]> {
    const isMember = await this.membership.isMember(userId, organizationId);
    if (!isMember) throw new NotOrganizationMemberError();

    const spaceOrganization = await this.spaceAccess.findSpaceOrganization(spaceId);
    if (spaceOrganization !== organizationId) throw new SpaceNotFoundInOrganizationError();

    const [queryEmbedding] = await this.embeddingProvider.embedBatch([query], 'query');
    return this.embeddings.search(
      spaceId,
      queryEmbedding,
      this.embeddingProvider.modelName,
      Math.min(Math.max(limit, 1), MAX_LIMIT),
    );
  }
}
