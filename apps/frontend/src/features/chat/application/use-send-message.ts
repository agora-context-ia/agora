import { useCallback } from 'react';
import { ApiError } from '@/lib/api';
import { chatApiAdapter } from '../infra/http-chat-api.adapter';
import type { ChatMode } from '../domain/mode';
import type { Message } from '../domain/message';
import { useChatStore } from './use-conversation';

export function useSendMessage(organizationId: string | null, projectId: string | null) {
  const appendMessage = useChatStore((state) => state.appendMessage);
  const setSending = useChatStore((state) => state.setSending);
  const isSending = useChatStore((state) => state.isSending);

  const sendMessage = useCallback(
    async (content: string, mode: ChatMode, model: string | null) => {
      if (!organizationId || !projectId || !content.trim()) return;

      const userMessage: Message = {
        id: `local-${Date.now()}`,
        role: 'user',
        content: content.trim(),
        createdAt: new Date().toISOString(),
      };

      appendMessage(projectId, userMessage);
      setSending(true);

      try {
        const reply = await chatApiAdapter.sendMessage(
          organizationId,
          projectId,
          content.trim(),
          mode,
          model,
        );
        appendMessage(projectId, reply);
      } catch (error) {
        // El error se muestra como respuesta del asistente para no perder
        // el hilo de la conversación (no se persiste: es solo local).
        appendMessage(projectId, {
          id: `local-error-${Date.now()}`,
          role: 'assistant',
          content: `⚠️ ${error instanceof ApiError ? error.message : 'No se pudo obtener respuesta, intentá de nuevo.'}`,
          createdAt: new Date().toISOString(),
        });
      } finally {
        setSending(false);
      }
    },
    [organizationId, projectId, appendMessage, setSending],
  );

  return { sendMessage, isSending };
}
