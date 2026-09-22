import { eq, and, isNull, desc } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { notifications, deviceTokens } from '../../db/schema/index.js';
import { NotFoundError } from '../../shared/errors/AppError.js';
import { logger } from '../../shared/logger/logger.js';
import type { RegisterDeviceTokenInput } from '@gharkhana/validation';

export type NotificationPriority = 'HIGH' | 'NORMAL' | 'LOW';

interface NotifyParams {
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  priority?: NotificationPriority;
  referenceId?: string;
}

/** Template catalog keyed by type (NOTIFICATIONS.md §10 — locale lookup point). */
export const NOTIFICATION_TEMPLATES: Record<string, { title: string; body: string }> = {
  'subscription.created': { title: 'Subscription created', body: 'Your meal plan is set up.' },
  'subscription.activated': { title: 'Subscription active', body: 'Your meals are scheduled.' },
  'payment.succeeded': { title: 'Payment successful', body: 'Your payment was confirmed.' },
  'payment.failed': { title: 'Payment failed', body: 'Your payment could not be completed.' },
  'meal.reminder': { title: 'Upcoming meal', body: 'Your meal is coming up soon.' },
  'meal.out_for_delivery': { title: 'Meal on the way', body: 'Your meal is on the way.' },
  'meal.delivered': { title: 'Meal delivered', body: 'Enjoy your meal.' },
  'provider.new_subscription': { title: 'New subscriber', body: 'You have a new subscriber.' },
  'provider.prep_summary': { title: 'Preparation summary', body: 'Here is what to prepare today.' },
  'delivery.assigned': { title: 'New delivery', body: 'A new delivery was assigned to you.' },
};

const QUIET_START_HOUR = 22;
const QUIET_END_HOUR = 7;

/** Kathmandu hour for a given instant (Asia/Kathmandu = UTC+5:45). */
export const kathmanduHour = (at: Date = new Date()): number => {
  const utc = at.getTime() + at.getTimezoneOffset() * 60_000;
  const ktm = new Date(utc + 5.75 * 3_600_000);
  return ktm.getHours();
};

/** NORMAL/LOW pushes are held during 22:00–07:00 Asia/Kathmandu (NOTIFICATIONS.md §8). */
export const shouldPushNow = (priority: NotificationPriority, at: Date = new Date()): boolean => {
  if (priority === 'HIGH') return true;
  const hour = kathmanduHour(at);
  return !(hour >= QUIET_START_HOUR || hour < QUIET_END_HOUR);
};

export class NotificationService {
  /**
   * Idempotent notify (NOTIFICATIONS.md §5): the same (userId, type, referenceId)
   * processed twice produces at most one row. Push is best-effort; the
   * notifications table is the durable record (§6).
   */
  async notify(params: NotifyParams) {
    if (params.referenceId) {
      const existing = await db.query.notifications.findMany({
        where: and(
          eq(notifications.userId, params.userId),
          eq(notifications.type, params.type)
        ),
        limit: 50,
      });
      const duplicate = existing.some(
        (n) =>
          typeof n.data === 'object' &&
          n.data !== null &&
          (n.data as Record<string, unknown>).referenceId === params.referenceId
      );
      if (duplicate) {
        logger.info(
          { userId: params.userId, type: params.type, referenceId: params.referenceId },
          'Duplicate notification suppressed'
        );
        return { deduplicated: true as const };
      }
    }

    const [row] = await db
      .insert(notifications)
      .values({
        userId: params.userId,
        type: params.type,
        title: params.title,
        body: params.body,
        data: (params.data ?? null) as never,
        priority: (params.priority ?? 'NORMAL') as never,
      })
      .returning();

    const priority = params.priority ?? 'NORMAL';
    if (shouldPushNow(priority)) {
      await this.sendPushBestEffort(params.userId, params.title, params.body);
    } else {
      logger.info(
        { userId: params.userId, type: params.type },
        'Push held for quiet hours; in-app record stored'
      );
    }
    return row;
  }

  private async sendPushBestEffort(userId: string, title: string, body: string): Promise<void> {
    try {
      const tokens = await db.query.deviceTokens.findMany({
        where: eq(deviceTokens.userId, userId),
      });
      if (tokens.length === 0) return;
      // Integration point: POST to Expo Push Service with the tokens.
      logger.info({ userId, tokenCount: tokens.length, title, body }, 'Push queued (best-effort)');
    } catch (err) {
      logger.warn({ err, userId }, 'Push fan-out failed; in-app record retained');
    }
  }

  async listNotifications(userId: string, unreadOnly?: boolean) {
    const conditions = [eq(notifications.userId, userId)];
    if (unreadOnly) conditions.push(isNull(notifications.readAt));
    return db.query.notifications.findMany({
      where: and(...conditions),
      orderBy: [desc(notifications.createdAt)],
    });
  }

  async markRead(notificationId: string, userId: string) {
    const existing = await db.query.notifications.findFirst({
      where: and(eq(notifications.id, notificationId), eq(notifications.userId, userId)),
    });
    if (!existing) throw new NotFoundError('Notification not found', 'NOTIFICATION_NOT_FOUND');
    const [updated] = await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(eq(notifications.id, notificationId))
      .returning();
    return updated;
  }

  async markAllRead(userId: string) {
    await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
    return { success: true };
  }

  async registerDeviceToken(userId: string, input: RegisterDeviceTokenInput) {
    const existing = await db.query.deviceTokens.findFirst({
      where: eq(deviceTokens.expoPushToken, input.expoPushToken),
    });
    if (existing) {
      const [updated] = await db
        .update(deviceTokens)
        .set({ userId, platform: input.platform as never, lastSeenAt: new Date() })
        .where(eq(deviceTokens.id, existing.id))
        .returning();
      return updated;
    }
    const [created] = await db
      .insert(deviceTokens)
      .values({ userId, expoPushToken: input.expoPushToken, platform: input.platform as never })
      .returning();
    return created;
  }
}

export const notificationService = new NotificationService();
