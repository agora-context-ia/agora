import type { ChatMode } from '../domain/mode';
import type { Message } from '../domain/message';

export interface ChatApiPort {
  getHistory(organizationId: string, spaceId: string): Promise<Message[]>;
  // model: modelo de IA elegido en el ModelSelector (null si la
  // organización no configuró ningún proveedor todavía).
  sendMessage(
    organizationId: string,
    spaceId: string,
    content: string,
    mode: ChatMode,
    model: string | null,
  ): Promise<Message>;
}
