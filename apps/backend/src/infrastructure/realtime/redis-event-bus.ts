import { redisConnection, redisSubscriber } from '../redis/redis-clients';
import { sseRegistry } from './sse-connection-registry';

/**
 * Per-user event bus over Redis pub/sub. Every backend instance
 * subscribes to events:user:* and forwards to its local SSE sockets;
 * publishing works the same from the API or from the worker.
 */

const CHANNEL_PREFIX = 'events:user:';

/** Subscribes this instance to user channels and forwards to local SSE sockets. */
export function startRealtimeEventBus(): void {
  void redisSubscriber.psubscribe(`${CHANNEL_PREFIX}*`);
  redisSubscriber.on('pmessage', (_pattern, channel, message) => {
    const userId = channel.slice(CHANNEL_PREFIX.length);
    if (sseRegistry.hasLocalConnections(userId)) {
      sseRegistry.sendToUser(userId, message);
    }
  });
}

/** Publishes an event to every instance holding SSE connections for the user. */
export async function publishToUser(userId: string, event: object): Promise<void> {
  await redisConnection.publish(`${CHANNEL_PREFIX}${userId}`, JSON.stringify(event));
}
