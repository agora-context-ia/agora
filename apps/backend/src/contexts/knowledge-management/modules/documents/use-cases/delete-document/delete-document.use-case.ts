import { NotOrganizationMemberError } from '../../../projects/domain/space';
import type { OrganizationMembershipPort } from '../../../projects/ports/organization-membership.port';
import {
  DocumentNotFoundError,
  SpaceNotFoundInOrganizationError,
} from '../../domain/document';
import type { DocumentRepositoryPort } from '../../ports/document-repository.port';
import type { EmbeddingRepositoryPort } from '../../ports/embedding-repository.port';
import type { SpaceAccessPort } from '../../ports/space-access.port';

/** Deletes a stored file from disk/storage. */
export interface FileRemoverPort {
  remove(relativePath: string): Promise<void>;
}

/** Soft-deletes a document and hard-deletes its derived data and file. */
export class DeleteDocumentUseCase {
  constructor(
    private readonly documents: DocumentRepositoryPort,
    private readonly embeddings: EmbeddingRepositoryPort,
    private readonly membership: OrganizationMembershipPort,
    private readonly spaceAccess: SpaceAccessPort,
    private readonly fileRemover: FileRemoverPort,
  ) {}

  async execute(
    userId: string,
    organizationId: string,
    spaceId: string,
    documentId: string,
  ): Promise<void> {
    const isMember = await this.membership.isMember(userId, organizationId);
    if (!isMember) throw new NotOrganizationMemberError();

    const spaceOrganization = await this.spaceAccess.findSpaceOrganization(spaceId);
    if (spaceOrganization !== organizationId) throw new SpaceNotFoundInOrganizationError();

    const document = await this.documents.findById(documentId);
    if (!document || document.spaceId !== spaceId) throw new DocumentNotFoundError();

    // Document and source: soft delete. Chunks/embeddings (derived data)
    // and the physical file: hard delete.
    await this.documents.softDelete(documentId);
    await this.embeddings.deleteForSource(document.sourceId);
    if (document.filePath) await this.fileRemover.remove(document.filePath);
  }
}
