import { randomUUID } from 'node:crypto';
import type { Response } from 'express';
import { redisConnection } from '../redis/redis-clients';

// Registro de conexiones SSE: en memoria (los sockets viven en este proceso)
// + espejo en Redis (sse:user:{userId}) para saber qué usuarios están
// conectados y en qué instancia cuando haya más de un backend.

const REGISTRY_TTL_SECONDS = 90; // ~3 heartbeats: si la instancia muere, expira solo

export const instanceId = randomUUID().slice(0, 8);

class SseConnectionRegistry {
  private readonly byUser = new Map<string, Map<string, Response>>();

  async register(userId: string, connectionId: string, res: Response): Promise<void> {
    let connections = this.byUser.get(userId);
    if (!connections) {
      connections = new Map();
      this.byUser.set(userId, connections);
    }
    connections.set(connectionId, res);

    const key = `sse:user:${userId}`;
    await redisConnection
      .multi()
      .sadd(key, `${instanceId}:${connectionId}`)
      .expire(key, REGISTRY_TTL_SECONDS)
      .exec();
  }

  async touch(userId: string): Promise<void> {
    await redisConnection.expire(`sse:user:${userId}`, REGISTRY_TTL_SECONDS);
  }

  async unregister(userId: string, connectionId: string): Promise<void> {
    const connections = this.byUser.get(userId);
    connections?.delete(connectionId);
    if (connections?.size === 0) this.byUser.delete(userId);
    await redisConnection.srem(`sse:user:${userId}`, `${instanceId}:${connectionId}`);
  }

  /** Reenvía un evento (ya serializado) a las conexiones locales del usuario. */
  sendToUser(userId: string, serializedEvent: string): void {
    const connections = this.byUser.get(userId);
    if (!connections) return;
    for (const res of connections.values()) {
      res.write(`data: ${serializedEvent}\n\n`);
    }
  }

  hasLocalConnections(userId: string): boolean {
    return (this.byUser.get(userId)?.size ?? 0) > 0;
  }
}

export const sseRegistry = new SseConnectionRegistry();

export function newConnectionId(): string {
  return randomUUID();
}
