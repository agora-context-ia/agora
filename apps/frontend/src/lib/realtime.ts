import type { RealtimeEventDto } from '@contexthub-ai/shared-types';

// Canal SSE por sesión: el backend publica señales de invalidación
// (ej. document.updated) y la UI refetchea por la API normal. Un solo
// EventSource vivo por sesión; se abre al iniciar/restaurar sesión y se
// cierra en el logout (ver use-auth).

const API_URL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

type EventHandler = (event: RealtimeEventDto) => void;
type ReconnectHandler = () => void;

let source: EventSource | null = null;
let wasDown = false;
const eventHandlers = new Set<EventHandler>();
const reconnectHandlers = new Set<ReconnectHandler>();

export function connectRealtime(): void {
  if (source) return;

  source = new EventSource(`${API_URL}/api/events`, { withCredentials: true });

  source.onmessage = (message) => {
    try {
      const event = JSON.parse(message.data as string) as RealtimeEventDto;
      for (const handler of eventHandlers) handler(event);
    } catch {
      // mensaje malformado: se ignora
    }
  };

  // EventSource reconecta solo; al volver se avisa para un refetch de
  // seguridad (pudo perderse un evento mientras el canal estaba caído).
  source.onerror = () => {
    wasDown = true;
  };
  source.onopen = () => {
    if (wasDown) {
      wasDown = false;
      for (const handler of reconnectHandlers) handler();
    }
  };
}

export function disconnectRealtime(): void {
  source?.close();
  source = null;
  wasDown = false;
}

export function subscribeRealtime(handler: EventHandler): () => void {
  eventHandlers.add(handler);
  return () => eventHandlers.delete(handler);
}

export function subscribeRealtimeReconnect(handler: ReconnectHandler): () => void {
  reconnectHandlers.add(handler);
  return () => reconnectHandlers.delete(handler);
}
