import { redisConnection, redisSubscriber } from '../redis/redis-clients';
import { sseRegistry } from './sse-connection-registry';

// Bus de eventos por usuario sobre Redis pub/sub. Cada instancia del backend
// se suscribe a events:user:* y reenvía a sus sockets SSE locales; publicar
// funciona igual desde el API o desde el worker.

const CHANNEL_PREFIX = 'events:user:';

export function startRealtimeEventBus(): void {
  void redisSubscriber.psubscribe(`${CHANNEL_PREFIX}*`);
  redisSubscriber.on('pmessage', (_pattern, channel, message) => {
    const userId = channel.slice(CHANNEL_PREFIX.length);
    if (sseRegistry.hasLocalConnections(userId)) {
      sseRegistry.sendToUser(userId, message);
    }
  });
}

export async function publishToUser(userId: string, event: object): Promise<void> {
  await redisConnection.publish(`${CHANNEL_PREFIX}${userId}`, JSON.stringify(event));
}
