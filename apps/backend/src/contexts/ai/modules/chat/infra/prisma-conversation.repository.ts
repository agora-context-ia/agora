import { Prisma } from '@prisma/client';
import { prisma } from '../../../../../infrastructure/persistence/prisma-client';
import type { ChatMessage, ChatRole, ChatSource, Conversation } from '../domain/chat';
import type {
  AppendMessageData,
  ConversationRepositoryPort,
} from '../ports/conversation-repository.port';

const DEFAULT_MESSAGES_LIMIT = 50;

/** Prisma-backed store for conversations and messages (soft-delete aware). */
export class PrismaConversationRepository implements ConversationRepositoryPort {
  async create(spaceId: string, userId: string): Promise<Conversation> {
    const created = await prisma.conversation.create({
      data: { spaceId, userId },
    });
    return toConversation(created);
  }

  async listBySpaceAndUser(spaceId: string, userId: string): Promise<Conversation[]> {
    const conversations = await prisma.conversation.findMany({
      where: { spaceId, userId, status: true, deletedAt: null },
      orderBy: { updatedAt: 'desc' },
    });
    return conversations.map(toConversation);
  }

  async findOwned(
    conversationId: string,
    spaceId: string,
    userId: string,
  ): Promise<Conversation | null> {
    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, spaceId, userId, status: true, deletedAt: null },
    });
    return conversation ? toConversation(conversation) : null;
  }

  async setTitle(conversationId: string, title: string): Promise<void> {
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { title },
    });
  }

  async appendMessage(data: AppendMessageData): Promise<ChatMessage> {
    // The conversation's updatedAt drives the sidebar ordering, so every
    // new message bumps it (same transaction as the insert).
    const [message] = await prisma.$transaction([
      prisma.message.create({
        data: {
          conversationId: data.conversationId,
          role: data.role,
          content: data.content,
          modelName: data.modelName ?? null,
          tokensInput: data.tokensInput ?? null,
          tokensOutput: data.tokensOutput ?? null,
          sources: data.sources ? (data.sources as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
        },
      }),
      prisma.conversation.update({
        where: { id: data.conversationId },
        data: { updatedAt: new Date() },
      }),
    ]);
    return toChatMessage(message);
  }

  async listMessages(
    conversationId: string,
    limit: number = DEFAULT_MESSAGES_LIMIT,
  ): Promise<ChatMessage[]> {
    // Fetch the latest `limit` messages in chronological order: desc + reverse.
    // id (uuidv7, time-ordered) breaks createdAt ties so a user/assistant
    // pair persisted in the same millisecond keeps insertion order.
    const messages = await prisma.message.findMany({
      where: { conversationId, status: true, deletedAt: null },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit,
    });
    return messages.reverse().map(toChatMessage);
  }
}

function toConversation(conversation: {
  id: string;
  spaceId: string;
  title: string | null;
  createdAt: Date;
  updatedAt: Date;
}): Conversation {
  return {
    id: conversation.id,
    spaceId: conversation.spaceId,
    title: conversation.title,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
  };
}

function toChatMessage(message: {
  id: string;
  role: string;
  content: string;
  createdAt: Date;
  sources: Prisma.JsonValue;
}): ChatMessage {
  return {
    id: message.id,
    role: message.role as ChatRole,
    content: message.content,
    createdAt: message.createdAt,
    // Stored as JSONB with the exact ChatSource[] shape (see appendMessage).
    sources: Array.isArray(message.sources)
      ? (message.sources as unknown as ChatSource[])
      : undefined,
  };
}
