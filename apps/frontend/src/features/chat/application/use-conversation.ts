import { useEffect } from 'react';
import { create } from 'zustand';
import { chatApiAdapter } from '../infra/http-chat-api.adapter';
import type { Message } from '../domain/message';

interface ChatStoreState {
  messagesByProject: Record<string, Message[]>;
  loadedProjectIds: Set<string>;
  isLoading: boolean;
  isSending: boolean;
  loadConversation: (organizationId: string, projectId: string) => Promise<void>;
  appendMessage: (projectId: string, message: Message) => void;
  setSending: (isSending: boolean) => void;
}

export const useChatStore = create<ChatStoreState>((set, get) => ({
  messagesByProject: {},
  loadedProjectIds: new Set(),
  isLoading: false,
  isSending: false,
  loadConversation: async (organizationId: string, projectId: string) => {
    if (get().loadedProjectIds.has(projectId)) return;

    set({ isLoading: true });
    let messages: Message[] = [];
    try {
      messages = await chatApiAdapter.getHistory(organizationId, projectId);
    } catch {
      // Sin historial disponible (backend caído o error): chat vacío.
    }

    set((state) => ({
      isLoading: false,
      messagesByProject: {
        ...state.messagesByProject,
        [projectId]: messages,
      },
      loadedProjectIds: new Set(state.loadedProjectIds).add(projectId),
    }));
  },
  appendMessage: (projectId: string, message: Message) =>
    set((state) => ({
      messagesByProject: {
        ...state.messagesByProject,
        [projectId]: [...(state.messagesByProject[projectId] ?? []), message],
      },
    })),
  setSending: (isSending) => set({ isSending }),
}));

export function useConversation(organizationId: string | null, projectId: string | null) {
  const messagesByProject = useChatStore((state) => state.messagesByProject);
  const isLoading = useChatStore((state) => state.isLoading);
  const isSending = useChatStore((state) => state.isSending);
  const loadConversation = useChatStore((state) => state.loadConversation);

  useEffect(() => {
    if (organizationId && projectId) {
      loadConversation(organizationId, projectId);
    }
  }, [organizationId, projectId, loadConversation]);

  const messages = projectId ? (messagesByProject[projectId] ?? []) : [];

  return { messages, isLoading, isSending };
}
