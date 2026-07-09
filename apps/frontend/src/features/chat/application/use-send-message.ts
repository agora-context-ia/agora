import { useCallback } from 'react';
import { mockChatApiAdapter } from '../infra/mock-chat-api.adapter';
import type { ChatMode } from '../domain/mode';
import type { Message } from '../domain/message';
import { useChatStore } from './use-conversation';

export function useSendMessage(projectId: string | null) {
  const appendMessage = useChatStore((state) => state.appendMessage);
  const setSending = useChatStore((state) => state.setSending);
  const isSending = useChatStore((state) => state.isSending);

  const sendMessage = useCallback(
    async (content: string, mode: ChatMode) => {
      if (!projectId || !content.trim()) return;

      const userMessage: Message = {
        id: `local-${Date.now()}`,
        role: 'user',
        content: content.trim(),
        createdAt: new Date().toISOString(),
      };

      appendMessage(projectId, userMessage);
      setSending(true);

      try {
        const reply = await mockChatApiAdapter.sendMessage(projectId, content, mode);
        appendMessage(projectId, reply);
      } finally {
        setSending(false);
      }
    },
    [projectId, appendMessage, setSending],
  );

  return { sendMessage, isSending };
}
