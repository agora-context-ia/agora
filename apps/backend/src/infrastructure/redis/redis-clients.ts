import { Redis } from 'ioredis';
import { env } from '../config/env';

// maxRetriesPerRequest: null es requisito de BullMQ (los comandos bloqueantes
// no deben cortarse por reintentos).
export const redisConnection = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });

// Un cliente en modo subscribe no puede ejecutar otros comandos: conexión
// dedicada para el pub/sub de SSE.
export const redisSubscriber = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });

export function createRedisConnection(): Redis {
  return new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });
}
