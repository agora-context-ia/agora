import { useEffect } from 'react';
import { create } from 'zustand';
import { mockChatApiAdapter } from '../infra/mock-chat-api.adapter';
import type { Message } from '../domain/message';

interface ChatStoreState {
  messagesByProject: Record<string, Message[]>;
  loadedProjectIds: Set<string>;
  isLoading: boolean;
  isSending: boolean;
  loadConversation: (projectId: string) => Promise<void>;
  appendMessage: (projectId: string, message: Message) => void;
  setSending: (isSending: boolean) => void;
}

export const useChatStore = create<ChatStoreState>((set, get) => ({
  messagesByProject: {},
  loadedProjectIds: new Set(),
  isLoading: false,
  isSending: false,
  loadConversation: async (projectId: string) => {
    if (get().loadedProjectIds.has(projectId)) return;

    set({ isLoading: true });
    const conversation = await mockChatApiAdapter.getHistory(projectId);

    set((state) => ({
      isLoading: false,
      messagesByProject: {
        ...state.messagesByProject,
        [projectId]: conversation?.messages ?? [],
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

export function useConversation(projectId: string | null) {
  const messagesByProject = useChatStore((state) => state.messagesByProject);
  const isLoading = useChatStore((state) => state.isLoading);
  const isSending = useChatStore((state) => state.isSending);
  const loadConversation = useChatStore((state) => state.loadConversation);

  useEffect(() => {
    if (projectId) {
      loadConversation(projectId);
    }
  }, [projectId, loadConversation]);

  const messages = projectId ? (messagesByProject[projectId] ?? []) : [];

  return { messages, isLoading, isSending };
}
