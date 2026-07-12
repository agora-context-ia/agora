import type {
  ChatMessageDto,
  ConversationDto,
  SendChatMessageResponseDto,
} from '@contexthub-ai/shared-types';
import { apiFetch } from '@/lib/api';
import type { ChatMode } from '../domain/mode';
import type { Conversation } from '../domain/conversation';
import type { Message } from '../domain/message';
import type { ChatApiPort } from '../ports/chat-api.port';

function toMessage(dto: ChatMessageDto): Message {
  return {
    id: dto.id,
    role: dto.role,
    content: dto.content,
    createdAt: dto.createdAt,
    // History carries persisted sources, so footnotes survive reloads.
    sources: dto.sources && dto.sources.length > 0 ? dto.sources : undefined,
  };
}

function toConversation(dto: ConversationDto): Conversation {
  return {
    id: dto.id,
    projectId: dto.spaceId,
    title: dto.title,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

class HttpChatApiAdapter implements ChatApiPort {
  async listConversations(organizationId: string, spaceId: string): Promise<Conversation[]> {
    const body = await apiFetch<{ conversations: ConversationDto[] }>(
      `/api/organizations/${organizationId}/spaces/${spaceId}/chat/conversations`,
    );
    return body.conversations.map(toConversation);
  }

  async createConversation(organizationId: string, spaceId: string): Promise<Conversation> {
    const body = await apiFetch<{ conversation: ConversationDto }>(
      `/api/organizations/${organizationId}/spaces/${spaceId}/chat/conversations`,
      { method: 'POST' },
    );
    return toConversation(body.conversation);
  }

  async getMessages(
    organizationId: string,
    spaceId: string,
    conversationId: string,
  ): Promise<Message[]> {
    const body = await apiFetch<{ messages: ChatMessageDto[] }>(
      `/api/organizations/${organizationId}/spaces/${spaceId}/chat/conversations/${conversationId}/messages`,
    );
    return body.messages.map(toMessage);
  }

  async sendMessage(
    organizationId: string,
    spaceId: string,
    conversationId: string,
    content: string,
    mode: ChatMode,
    model: string | null,
  ): Promise<Message> {
    const body = await apiFetch<SendChatMessageResponseDto>(
      `/api/organizations/${organizationId}/spaces/${spaceId}/chat/conversations/${conversationId}/messages`,
      {
        method: 'POST',
        body: JSON.stringify({ content, mode, model }),
      },
    );
    return {
      ...toMessage(body.message),
      sources: body.sources.length > 0 ? body.sources : undefined,
    };
  }
}

/** HTTP implementation of the chat API port. */
export const chatApiAdapter = new HttpChatApiAdapter();
