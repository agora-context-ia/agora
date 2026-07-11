/** Document fragment cited by an assistant reply. */
export interface MessageSource {
  documentName: string;
  fragment: string;
  relevance: number;
}

/** Author of a chat message. */
export type MessageRole = 'user' | 'assistant';

/** One chat message as rendered in the conversation. */
export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  sources?: MessageSource[];
  createdAt: string;
}
