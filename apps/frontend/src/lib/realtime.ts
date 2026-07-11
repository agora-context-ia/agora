import type { RealtimeEventDto } from '@contexthub-ai/shared-types';

// Per-session SSE channel: the backend publishes invalidation signals
// (e.g. document.updated) and the UI refetches through the regular API.
// A single live EventSource per session; opened on login/restore and
// closed on logout (see use-auth).

const API_URL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

type EventHandler = (event: RealtimeEventDto) => void;
type ReconnectHandler = () => void;

let source: EventSource | null = null;
let wasDown = false;
const eventHandlers = new Set<EventHandler>();
const reconnectHandlers = new Set<ReconnectHandler>();

/** Opens the per-session SSE channel (idempotent). */
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

  // EventSource reconnects on its own; on recovery a safety refetch is
  // signaled (an event may have been lost while the channel was down).
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

/** Closes the SSE channel (called on logout). */
export function disconnectRealtime(): void {
  source?.close();
  source = null;
  wasDown = false;
}

/** Subscribes to realtime events; returns an unsubscribe function. */
export function subscribeRealtime(handler: EventHandler): () => void {
  eventHandlers.add(handler);
  return () => eventHandlers.delete(handler);
}

/** Notifies after a channel reconnection so consumers can refetch. */
export function subscribeRealtimeReconnect(handler: ReconnectHandler): () => void {
  reconnectHandlers.add(handler);
  return () => reconnectHandlers.delete(handler);
}
