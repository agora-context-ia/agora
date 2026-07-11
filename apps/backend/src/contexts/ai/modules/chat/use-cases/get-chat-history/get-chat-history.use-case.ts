import type { SpaceAccessPort } from '../../../../../knowledge-management/modules/documents/ports/space-access.port';
import type { OrganizationMembershipPort } from '../../../../../knowledge-management/modules/projects/ports/organization-membership.port';
import {
  NotOrganizationMemberError,
  SpaceNotFoundInOrganizationError,
  type ChatMessage,
} from '../../domain/chat';
import type { ConversationRepositoryPort } from '../../ports/conversation-repository.port';

export class GetChatHistoryUseCase {
  constructor(
    private readonly membership: OrganizationMembershipPort,
    private readonly spaceAccess: SpaceAccessPort,
    private readonly conversations: ConversationRepositoryPort,
  ) {}

  async execute(
    userId: string,
    organizationId: string,
    spaceId: string,
  ): Promise<ChatMessage[]> {
    const isMember = await this.membership.isMember(userId, organizationId);
    if (!isMember) throw new NotOrganizationMemberError();

    const spaceOrganization = await this.spaceAccess.findSpaceOrganization(spaceId);
    if (spaceOrganization !== organizationId) throw new SpaceNotFoundInOrganizationError();

    const conversation = await this.conversations.findBySpaceAndUser(spaceId, userId);
    if (!conversation) return [];

    return this.conversations.listMessages(conversation.id);
  }
}
