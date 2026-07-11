import type {
  ChatMessageDto,
  SendChatMessageResponseDto,
} from '@contexthub-ai/shared-types';
import { apiFetch } from '@/lib/api';
import type { ChatMode } from '../domain/mode';
import type { Message } from '../domain/message';
import type { ChatApiPort } from '../ports/chat-api.port';

function toMessage(dto: ChatMessageDto): Message {
  return {
    id: dto.id,
    role: dto.role,
    content: dto.content,
    createdAt: dto.createdAt,
  };
}

class HttpChatApiAdapter implements ChatApiPort {
  async getHistory(organizationId: string, spaceId: string): Promise<Message[]> {
    const body = await apiFetch<{ messages: ChatMessageDto[] }>(
      `/api/organizations/${organizationId}/spaces/${spaceId}/chat`,
    );
    return body.messages.map(toMessage);
  }

  async sendMessage(
    organizationId: string,
    spaceId: string,
    content: string,
    mode: ChatMode,
    model: string | null,
  ): Promise<Message> {
    const body = await apiFetch<SendChatMessageResponseDto>(
      `/api/organizations/${organizationId}/spaces/${spaceId}/chat`,
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

export const chatApiAdapter = new HttpChatApiAdapter();
