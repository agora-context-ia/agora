import type { Message } from './message';

/** A conversation thread within a project. */
export interface Conversation {
  id: string;
  projectId: string;
  title: string;
  messages: Message[];
}
