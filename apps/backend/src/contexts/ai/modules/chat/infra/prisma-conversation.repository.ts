import { prisma } from '../../../../../infrastructure/persistence/prisma-client';
import type { ChatMessage, ChatRole } from '../domain/chat';
import type {
  AppendMessageData,
  ConversationRepositoryPort,
} from '../ports/conversation-repository.port';

const DEFAULT_MESSAGES_LIMIT = 50;

/** Prisma-backed store for conversations and messages (soft-delete aware). */
export class PrismaConversationRepository implements ConversationRepositoryPort {
  async findOrCreate(spaceId: string, userId: string): Promise<{ id: string }> {
    const existing = await this.findBySpaceAndUser(spaceId, userId);
    if (existing) return existing;

    const created = await prisma.conversation.create({
      data: { spaceId, userId },
      select: { id: true },
    });
    return created;
  }

  async findBySpaceAndUser(spaceId: string, userId: string): Promise<{ id: string } | null> {
    const conversation = await prisma.conversation.findFirst({
      where: { spaceId, userId, status: true, deletedAt: null },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });
    return conversation;
  }

  async appendMessage(data: AppendMessageData): Promise<ChatMessage> {
    const message = await prisma.message.create({
      data: {
        conversationId: data.conversationId,
        role: data.role,
        content: data.content,
        modelName: data.modelName ?? null,
        tokensInput: data.tokensInput ?? null,
        tokensOutput: data.tokensOutput ?? null,
      },
    });
    return toChatMessage(message);
  }

  async listMessages(
    conversationId: string,
    limit: number = DEFAULT_MESSAGES_LIMIT,
  ): Promise<ChatMessage[]> {
    // Fetch the latest `limit` messages in chronological order: desc + reverse.
    const messages = await prisma.message.findMany({
      where: { conversationId, status: true, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return messages.reverse().map(toChatMessage);
  }
}

function toChatMessage(message: {
  id: string;
  role: string;
  content: string;
  createdAt: Date;
}): ChatMessage {
  return {
    id: message.id,
    role: message.role as ChatRole,
    content: message.content,
    createdAt: message.createdAt,
  };
}
