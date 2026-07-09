import type { Conversation } from '../domain/conversation';
import type { ChatMode } from '../domain/mode';
import type { Message } from '../domain/message';

export interface ChatApiPort {
  getHistory(projectId: string): Promise<Conversation | null>;
  sendMessage(projectId: string, content: string, mode: ChatMode): Promise<Message>;
}
