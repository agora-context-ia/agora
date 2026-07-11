import { Redis } from 'ioredis';
import { env } from '../config/env';

// maxRetriesPerRequest: null is required by BullMQ (blocking commands
// must not be cut short by retries).
export const redisConnection = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });

// A client in subscribe mode cannot run other commands: dedicated
// connection for the SSE pub/sub.
export const redisSubscriber = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });

/** Creates an extra connection (e.g. for a BullMQ worker). */
export function createRedisConnection(): Redis {
  return new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });
}
