import type { ChatMessage, ChatRole, ChatSource, Conversation } from '../domain/chat';

/** Payload to persist a chat message, with model/token metadata for assistant turns. */
export interface AppendMessageData {
  conversationId: string;
  role: ChatRole;
  content: string;
  modelName?: string | null;
  tokensInput?: number | null;
  tokensOutput?: number | null;
  /** Sources that grounded an assistant reply (persisted for history). */
  sources?: ChatSource[];
}

/**
 * Persistence contract for conversations and their messages. A user can
 * hold many conversations per space; every lookup is scoped by
 * (spaceId, userId) so a user never reads another user's threads.
 */
export interface ConversationRepositoryPort {
  create(spaceId: string, userId: string): Promise<Conversation>;
  /** The user's conversations in a space, most recently active first. */
  listBySpaceAndUser(spaceId: string, userId: string): Promise<Conversation[]>;
  /** Null when the conversation does not exist or belongs to another user/space. */
  findOwned(conversationId: string, spaceId: string, userId: string): Promise<Conversation | null>;
  setTitle(conversationId: string, title: string): Promise<void>;
  /** Persists the message and bumps the conversation's updatedAt. */
  appendMessage(data: AppendMessageData): Promise<ChatMessage>;
  /** Returns the latest `limit` messages in chronological order. */
  listMessages(conversationId: string, limit?: number): Promise<ChatMessage[]>;
}
