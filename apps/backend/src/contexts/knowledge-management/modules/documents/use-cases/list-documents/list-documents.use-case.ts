import { NotOrganizationMemberError } from '../../../projects/domain/space';
import type { OrganizationMembershipPort } from '../../../projects/ports/organization-membership.port';
import {
  SpaceNotFoundInOrganizationError,
  type ContextDocumentEntity,
} from '../../domain/document';
import type { DocumentRepositoryPort } from '../../ports/document-repository.port';
import type { SpaceAccessPort } from '../../ports/space-access.port';

/** Lists the documents of a space, newest first, after access checks. */
export class ListDocumentsUseCase {
  constructor(
    private readonly documents: DocumentRepositoryPort,
    private readonly membership: OrganizationMembershipPort,
    private readonly spaceAccess: SpaceAccessPort,
  ) {}

  async execute(
    userId: string,
    organizationId: string,
    spaceId: string,
  ): Promise<ContextDocumentEntity[]> {
    const isMember = await this.membership.isMember(userId, organizationId);
    if (!isMember) throw new NotOrganizationMemberError();

    const spaceOrganization = await this.spaceAccess.findSpaceOrganization(spaceId);
    if (spaceOrganization !== organizationId) throw new SpaceNotFoundInOrganizationError();

    return this.documents.listBySpace(spaceId);
  }
}
