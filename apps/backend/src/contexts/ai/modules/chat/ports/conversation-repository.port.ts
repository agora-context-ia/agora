import type { ChatMessage, ChatRole } from '../domain/chat';

/** Payload to persist a chat message, with model/token metadata for assistant turns. */
export interface AppendMessageData {
  conversationId: string;
  role: ChatRole;
  content: string;
  modelName?: string | null;
  tokensInput?: number | null;
  tokensOutput?: number | null;
}

/** Persistence contract for conversations and their messages. */
export interface ConversationRepositoryPort {
  /**
   * One conversation per (space, user) for now: created on the first
   * message and reused afterwards.
   */
  findOrCreate(spaceId: string, userId: string): Promise<{ id: string }>;
  findBySpaceAndUser(spaceId: string, userId: string): Promise<{ id: string } | null>;
  appendMessage(data: AppendMessageData): Promise<ChatMessage>;
  /** Returns the latest `limit` messages in chronological order. */
  listMessages(conversationId: string, limit?: number): Promise<ChatMessage[]>;
}
