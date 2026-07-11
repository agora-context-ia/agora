import type { ChatMessage, ChatRole } from '../domain/chat';

export interface AppendMessageData {
  conversationId: string;
  role: ChatRole;
  content: string;
  modelName?: string | null;
  tokensInput?: number | null;
  tokensOutput?: number | null;
}

export interface ConversationRepositoryPort {
  // Una conversación por (espacio, usuario) por ahora: se crea al primer
  // mensaje y se reutiliza después.
  findOrCreate(spaceId: string, userId: string): Promise<{ id: string }>;
  findBySpaceAndUser(spaceId: string, userId: string): Promise<{ id: string } | null>;
  appendMessage(data: AppendMessageData): Promise<ChatMessage>;
  listMessages(conversationId: string, limit?: number): Promise<ChatMessage[]>;
}
