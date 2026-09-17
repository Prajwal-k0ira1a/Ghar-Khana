import { eq } from 'drizzle-orm';
import { db } from '../../db/index.js';
import {
  subscriptions,
  mealOccurrences,
} from '../../db/schema/index.js';
import { logger } from '../../shared/logger/logger.js';
import type { MealType } from '@gharkhana/types';

// Standard delivery target times for Kathmandu (in UTC terms for local hours)
// Kathmandu is UTC+05:45
const DEFAULT_DELIVERY_HOURS: Record<MealType, { hour: number; minute: number }> = {
  BREAKFAST: { hour: 8, minute: 30 },
  LUNCH: { hour: 13, minute: 0 },
  SNACKS: { hour: 16, minute: 30 },
  DINNER: { hour: 20, minute: 0 },
};

export function computeOccurrenceCutoff(
  dateStr: string,
  mealType: MealType,
  policy: { cutoffOffsetHours?: number | null; cutoffTimeOfDay?: string | null } | null
): Date {
  // Parse date: YYYY-MM-DD
  const [year, month, day] = dateStr.split('-').map(Number);
  const targetTime = DEFAULT_DELIVERY_HOURS[mealType] || { hour: 13, minute: 0 };

  // Delivery target in local Kathmandu time (UTC+5:45)
  // Store as UTC
  const deliveryDate = new Date(Date.UTC(year, month - 1, day, targetTime.hour - 5, targetTime.minute - 45));

  if (!policy) {
    // Default fallback: 12 hours before delivery
    return new Date(deliveryDate.getTime() - 12 * 60 * 60 * 1000);
  }

  if (policy.cutoffOffsetHours) {
    return new Date(deliveryDate.getTime() - policy.cutoffOffsetHours * 60 * 60 * 1000);
  }

  if (policy.cutoffTimeOfDay) {
    // Cutoff on the day before the meal, at policy.cutoffTimeOfDay (e.g. 20:00)
    const [cHour, cMinute] = policy.cutoffTimeOfDay.split(':').map(Number);
    // Previous day in Kathmandu
    const prevDayUtc = new Date(Date.UTC(year, month - 1, day - 1, cHour - 5, cMinute - 45));
    return prevDayUtc;
  }

  return new Date(deliveryDate.getTime() - 12 * 60 * 60 * 1000);
}

export function formatDateToYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export class SubscriptionEngine {
  /**
   * Generates MealOccurrences for an active subscription up to `windowDays` ahead of today.
   * STRICTLY IDEMPOTENT: Uses .onConflictDoNothing() targeting (subscription_id, scheduled_date).
   */
  async generateOccurrences(
    subscriptionId: string,
    windowDays = 14
  ): Promise<{ generatedCount: number; dates: string[] }> {
    const sub = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.id, subscriptionId),
      with: {
        schedule: {
          with: {
            defaultMenuItem: true,
          },
        },
        provider: {
          with: {
            cutoffPolicies: true,
          },
        },
      },
    });

    if (!sub) {
      throw new Error(`Subscription ${subscriptionId} not found`);
    }

    if (sub.status !== 'ACTIVE' && sub.status !== 'DRAFT') {
      logger.info(
        { subscriptionId, status: sub.status },
        'Skipping occurrence generation for non-active subscription'
      );
      return { generatedCount: 0, dates: [] };
    }

    // Schedule map: dayOfWeek -> scheduleEntry
    const scheduleMap = new Map<number, typeof sub.schedule[0]>();
    for (const item of sub.schedule) {
      scheduleMap.set(item.dayOfWeek, item);
    }

    if (scheduleMap.size === 0) {
      logger.warn({ subscriptionId }, 'Subscription has no recurring schedule entries');
      return { generatedCount: 0, dates: [] };
    }

    // Find provider cutoff policy (matching mealType or catch-all)
    const policy =
      sub.provider.cutoffPolicies.find((p) => p.mealType === sub.mealType) ||
      sub.provider.cutoffPolicies.find((p) => p.mealType === null) ||
      null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const subStart = new Date(sub.startDate);
    const subEnd = new Date(sub.endDate);

    const windowEnd = new Date(today.getTime() + windowDays * 24 * 60 * 60 * 1000);

    // Range: max(today, subStart) to min(windowEnd, subEnd)
    const rangeStart = today > subStart ? today : subStart;
    const rangeEnd = windowEnd < subEnd ? windowEnd : subEnd;

    if (rangeStart > rangeEnd) {
      return { generatedCount: 0, dates: [] };
    }

    const occurrencesToInsert: Array<{
      subscriptionId: string;
      providerId: string;
      scheduledDate: string;
      menuItemId: string;
      quantity: number;
      unitPrice: string;
      totalPrice: string;
      status: 'SCHEDULED';
      customizationSource: 'DEFAULT';
      cutoffAt: Date;
    }> = [];

    const generatedDates: string[] = [];
    const current = new Date(rangeStart);

    while (current <= rangeEnd) {
      const dayOfWeek = current.getDay(); // 0 = Sunday, 1 = Monday, ...
      const scheduleEntry = scheduleMap.get(dayOfWeek);

      if (scheduleEntry) {
        const dateStr = formatDateToYmd(current);
        const cutoffAt = computeOccurrenceCutoff(dateStr, sub.mealType as MealType, policy);
        const unitPrice = scheduleEntry.defaultMenuItem.price;
        const quantity = scheduleEntry.quantity || sub.quantity || 1;
        const totalNum = parseFloat(unitPrice) * quantity;
        const totalPrice = totalNum.toFixed(2);

        occurrencesToInsert.push({
          subscriptionId: sub.id,
          providerId: sub.providerId,
          scheduledDate: dateStr,
          menuItemId: scheduleEntry.defaultMenuItemId,
          quantity,
          unitPrice,
          totalPrice,
          status: 'SCHEDULED',
          customizationSource: 'DEFAULT',
          cutoffAt,
        });

        generatedDates.push(dateStr);
      }

      // Next day
      current.setDate(current.getDate() + 1);
    }

    if (occurrencesToInsert.length === 0) {
      return { generatedCount: 0, dates: [] };
    }

    // Perform IDEMPOTENT batch insert using onConflictDoNothing
    const inserted = await db
      .insert(mealOccurrences)
      .values(occurrencesToInsert)
      .onConflictDoNothing({
        target: [mealOccurrences.subscriptionId, mealOccurrences.scheduledDate],
      })
      .returning();

    logger.info(
      {
        subscriptionId,
        requestedOccurrences: occurrencesToInsert.length,
        newlyInserted: inserted.length,
      },
      'Subscription occurrence generation completed'
    );

    return {
      generatedCount: inserted.length,
      dates: generatedDates,
    };
  }
}

export const subscriptionEngine = new SubscriptionEngine();
