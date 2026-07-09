import type { Message } from './message';

export interface Conversation {
  id: string;
  projectId: string;
  title: string;
  messages: Message[];
}
