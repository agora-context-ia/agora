import { NotOrganizationMemberError } from '../../../projects/domain/space';
import type { OrganizationMembershipPort } from '../../../projects/ports/organization-membership.port';
import {
  DocumentNotFoundError,
  SpaceNotFoundInOrganizationError,
  type ContextDocumentEntity,
} from '../../domain/document';
import type { DocumentProcessingQueuePort } from '../../ports/document-processing-queue.port';
import type { DocumentRepositoryPort } from '../../ports/document-repository.port';
import type { SpaceAccessPort } from '../../ports/space-access.port';

// Reprocesar = volver a extraer/chunkear/embeber (p. ej. tras cambiar de
// proveedor de embeddings). Los chunks/vectores viejos se reemplazan en
// ProcessDocumentUseCase.
export class ReprocessDocumentUseCase {
  constructor(
    private readonly documents: DocumentRepositoryPort,
    private readonly membership: OrganizationMembershipPort,
    private readonly spaceAccess: SpaceAccessPort,
    private readonly queue: DocumentProcessingQueuePort,
  ) {}

  async execute(
    userId: string,
    organizationId: string,
    spaceId: string,
    documentId: string,
  ): Promise<ContextDocumentEntity> {
    const isMember = await this.membership.isMember(userId, organizationId);
    if (!isMember) throw new NotOrganizationMemberError();

    const spaceOrganization = await this.spaceAccess.findSpaceOrganization(spaceId);
    if (spaceOrganization !== organizationId) throw new SpaceNotFoundInOrganizationError();

    const document = await this.documents.findById(documentId);
    if (!document || document.spaceId !== spaceId) throw new DocumentNotFoundError();

    await this.documents.setProcessingStatus(documentId, 'pending');
    await this.queue.enqueue(documentId);

    return { ...document, processingStatus: 'pending', processingError: null };
  }
}
