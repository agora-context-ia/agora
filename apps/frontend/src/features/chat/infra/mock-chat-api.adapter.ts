import { mockConversations } from '@/lib/mock-data/conversations.mock';
import type { Conversation } from '../domain/conversation';
import type { Message } from '../domain/message';
import type { ChatMode } from '../domain/mode';
import type { ChatApiPort } from '../ports/chat-api.port';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const MODE_REPLIES: Record<ChatMode, string> = {
  general: 'Según la documentación del proyecto, esto es lo que encontré relacionado a tu consulta.',
  'explain-process':
    'Este proceso consta de varios pasos documentados. Te detallo la secuencia principal según los manuales disponibles.',
  'design-requirement':
    'Puedo ayudarte a redactar ese requerimiento. Basándome en documentos similares, propongo la siguiente estructura.',
  summary: 'Aquí tenés un resumen de los puntos más relevantes de los documentos consultados.',
  'explain-rules': 'Estas son las reglas de negocio documentadas que aplican a tu pregunta.',
  'detect-contradictions':
    'Revisé los documentos relacionados y no encontré contradicciones relevantes por ahora, salvo la siguiente observación.',
  'acceptance-criteria': 'Te propongo los siguientes criterios de aceptación en base a los documentos del proyecto.',
};

class MockChatApiAdapter implements ChatApiPort {
  async getHistory(projectId: string): Promise<Conversation | null> {
    await delay(300);
    return mockConversations[projectId] ?? null;
  }

  async sendMessage(projectId: string, content: string, mode: ChatMode): Promise<Message> {
    await delay(600);

    const baseReply = MODE_REPLIES[mode];
    const shouldCiteSources = content.length % 2 === 0;

    return {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: `${baseReply}\n\n(Respuesta simulada para el proyecto "${projectId}".)`,
      sources: shouldCiteSources
        ? [
            {
              documentName: 'Documento-Referencia.pdf',
              fragment: 'Fragmento relevante extraído automáticamente del documento fuente para esta respuesta.',
              relevance: 0.75,
            },
          ]
        : undefined,
      createdAt: new Date().toISOString(),
    };
  }
}

export const mockChatApiAdapter = new MockChatApiAdapter();
