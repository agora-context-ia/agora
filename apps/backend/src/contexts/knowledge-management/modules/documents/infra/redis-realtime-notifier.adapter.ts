import { publishToUser } from '../../../../../infrastructure/realtime/redis-event-bus';
import { prisma } from '../../../../../infrastructure/persistence/prisma-client';
import type {
  DocumentUpdatedEvent,
  RealtimeNotifierPort,
} from '../ports/realtime-notifier.port';

/**
 * Notifies ALL active members of the organization (everyone sees the
 * org's spaces). The event is only an invalidation signal.
 */
export class RedisRealtimeNotifierAdapter implements RealtimeNotifierPort {
  async notifyDocumentUpdated(event: DocumentUpdatedEvent): Promise<void> {
    const members = await prisma.organizationMember.findMany({
      where: { organizationId: event.organizationId, status: true, deletedAt: null },
      select: { userId: true },
    });

    const payload = { type: 'document.updated' as const, ...event };
    await Promise.all(members.map((member) => publishToUser(member.userId, payload)));
  }
}
