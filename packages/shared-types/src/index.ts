export interface Project {
  id: string;
  name: string;
}

export interface Document {
  id: string;
  projectId: string;
  name: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}
