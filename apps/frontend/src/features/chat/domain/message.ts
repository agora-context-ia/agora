export interface MessageSource {
  documentName: string;
  fragment: string;
  relevance: number;
}

export type MessageRole = 'user' | 'assistant';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  sources?: MessageSource[];
  createdAt: string;
}
