import type { ChatMode } from '../domain/mode';
import type { Message } from '../domain/message';

/** API client contract for the chat feature. */
export interface ChatApiPort {
  getHistory(organizationId: string, spaceId: string): Promise<Message[]>;
  // model: AI model chosen in the ModelSelector (null when the
  // organization has not configured any provider yet).
  sendMessage(
    organizationId: string,
    spaceId: string,
    content: string,
    mode: ChatMode,
    model: string | null,
  ): Promise<Message>;
}
