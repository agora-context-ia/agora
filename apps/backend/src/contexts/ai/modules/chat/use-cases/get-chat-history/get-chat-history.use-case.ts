import {
  NotOrganizationMemberError,
  SpaceNotFoundInOrganizationError,
  type ChatMessage,
} from '../../domain/chat';
import type { ConversationRepositoryPort } from '../../ports/conversation-repository.port';
import type { OrganizationMembershipPort } from '../../ports/organization-membership.port';
import type { SpaceAccessPort } from '../../ports/space-access.port';

/**
 * Returns the user's conversation history for a space, oldest first.
 * An empty array means the user has not chatted in that space yet.
 */
export class GetChatHistoryUseCase {
  constructor(
    private readonly membership: OrganizationMembershipPort,
    private readonly spaceAccess: SpaceAccessPort,
    private readonly conversations: ConversationRepositoryPort,
  ) {}

  /**
   * @throws NotOrganizationMemberError when the user is not a member.
   * @throws SpaceNotFoundInOrganizationError when the space belongs to another org.
   */
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
