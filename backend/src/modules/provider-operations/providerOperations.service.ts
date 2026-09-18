import { eq, and, notInArray, gte, lte, asc, desc } from 'drizzle-orm';
import { db } from '../../db/index.js';
import {
  mealOccurrences,
  subscriptions,
  deliveries,
} from '../../db/schema/index.js';
import { NotFoundError, ForbiddenError, BusinessRuleError } from '../../shared/errors/AppError.js';
import type { OccurrenceStatus } from '@gharkhana/types';
import type { UpdateMealStatusInput } from '@gharkhana/validation';

export function getTodayDateStrNepal(): string {
  // Nepal Standard Time is UTC + 5:45
  const now = new Date();
  const nepalOffsetMs = (5 * 60 + 45) * 60 * 1000;
  const nepalTime = new Date(now.getTime() + nepalOffsetMs);
  return nepalTime.toISOString().split('T')[0];
}

export class ProviderOperationsService {
  /**
   * Real-time preparation summary for today (Phase 3 Exit Criteria).
   * Aggregates total portions needed per dish, accounting for daily overrides,
   * while strictly omitting skipped and cancelled meals.
   */
  async getTodayPreparationSummary(providerId: string, dateStr?: string) {
    const targetDate = dateStr || getTodayDateStrNepal();

    // 1. Fetch all occurrences for this provider on the target date
    const occurrences = await db.query.mealOccurrences.findMany({
      where: and(
        eq(mealOccurrences.providerId, providerId),
        eq(mealOccurrences.scheduledDate, targetDate),
        notInArray(mealOccurrences.status, ['SKIPPED', 'CANCELLED'])
      ),
      with: {
        menuItem: true,
        subscription: {
          with: {
            customer: true,
            location: true,
          },
        },
        delivery: true,
      },
      orderBy: [asc(mealOccurrences.createdAt)],
    });

    // 2. Aggregate portions grouped by dish
    const dishMap = new Map<
      string,
      {
        menuItemId: string;
        name: string;
        portions: number;
        unitPrice: string;
        mealType: string;
      }
    >();

    const statusCounts: Record<string, number> = {
      SCHEDULED: 0,
      CONFIRMED: 0,
      PREPARING: 0,
      READY: 0,
      PICKED_UP: 0,
      DELIVERED: 0,
    };

    let totalPortions = 0;

    for (const occ of occurrences) {
      const qty = occ.quantity || 1;
      totalPortions += qty;

      if (statusCounts[occ.status] !== undefined) {
        statusCounts[occ.status] += qty;
      }

      const existingDish = dishMap.get(occ.menuItemId);
      if (existingDish) {
        existingDish.portions += qty;
      } else {
        dishMap.set(occ.menuItemId, {
          menuItemId: occ.menuItemId,
          name: occ.menuItem.name,
          portions: qty,
          unitPrice: occ.unitPrice,
          mealType: occ.menuItem.mealType,
        });
      }
    }

    // 3. Format individual meal delivery list
    const meals = occurrences.map((occ) => ({
      id: occ.id,
      subscriptionId: occ.subscriptionId,
      customerName: occ.subscription.customer.name,
      customerPhone: occ.subscription.customer.phone,
      deliveryAddress: occ.subscription.location.addressLine,
      deliveryLandmark: occ.subscription.location.landmark,
      deliveryInstructions: occ.subscription.location.instructions,
      dishName: occ.menuItem.name,
      quantity: occ.quantity,
      unitPrice: occ.unitPrice,
      totalPrice: occ.totalPrice,
      status: occ.status,
      customizationSource: occ.customizationSource,
      notes: occ.subscription.location.instructions,
      cutoffAt: occ.cutoffAt.toISOString(),
      deliveryStatus: occ.delivery?.status || 'PENDING',
    }));

    return {
      date: targetDate,
      totalPortions,
      dishes: Array.from(dishMap.values()),
      statusCounts,
      meals,
    };
  }

  /**
   * Forecast preparation load for the next N days.
   */
  async getUpcomingPreparationForecast(providerId: string, days = 7) {
    const today = new Date();
    const todayStr = getTodayDateStrNepal();

    const endDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);
    const endDateStr = endDate.toISOString().split('T')[0];

    const occurrences = await db.query.mealOccurrences.findMany({
      where: and(
        eq(mealOccurrences.providerId, providerId),
        gte(mealOccurrences.scheduledDate, todayStr),
        lte(mealOccurrences.scheduledDate, endDateStr),
        notInArray(mealOccurrences.status, ['SKIPPED', 'CANCELLED'])
      ),
      with: {
        menuItem: true,
      },
      orderBy: [asc(mealOccurrences.scheduledDate)],
    });

    // Group by date
    const dateMap = new Map<
      string,
      {
        date: string;
        totalPortions: number;
        dishes: Map<string, { menuItemId: string; name: string; portions: number }>;
      }
    >();

    for (const occ of occurrences) {
      const date = occ.scheduledDate;
      let dayGroup = dateMap.get(date);
      if (!dayGroup) {
        dayGroup = {
          date,
          totalPortions: 0,
          dishes: new Map(),
        };
        dateMap.set(date, dayGroup);
      }

      const qty = occ.quantity || 1;
      dayGroup.totalPortions += qty;

      const dish = dayGroup.dishes.get(occ.menuItemId);
      if (dish) {
        dish.portions += qty;
      } else {
        dayGroup.dishes.set(occ.menuItemId, {
          menuItemId: occ.menuItemId,
          name: occ.menuItem.name,
          portions: qty,
        });
      }
    }

    const forecast = Array.from(dateMap.values()).map((d) => ({
      date: d.date,
      totalPortions: d.totalPortions,
      dishes: Array.from(d.dishes.values()),
    }));

    return forecast;
  }

  /**
   * Advance meal occurrence preparation status (SCHEDULED -> PREPARING -> READY).
   */
  async updateMealPreparationStatus(
    providerId: string,
    occurrenceId: string,
    input: UpdateMealStatusInput
  ) {
    const occ = await db.query.mealOccurrences.findFirst({
      where: eq(mealOccurrences.id, occurrenceId),
    });

    if (!occ) {
      throw new NotFoundError('Meal occurrence not found', 'MEAL_NOT_FOUND');
    }

    if (occ.providerId !== providerId) {
      throw new ForbiddenError('You do not own this meal occurrence', 'NOT_OWNER');
    }

    if (occ.status === 'SKIPPED' || occ.status === 'CANCELLED') {
      throw new BusinessRuleError(
        `Cannot update status of a ${occ.status} meal`,
        'INVALID_STATUS_TRANSITION'
      );
    }

    const [updated] = await db
      .update(mealOccurrences)
      .set({
        status: input.status as OccurrenceStatus,
        updatedAt: new Date(),
      })
      .where(eq(mealOccurrences.id, occurrenceId))
      .returning();

    // Ensure delivery entry exists
    const existingDelivery = await db.query.deliveries.findFirst({
      where: eq(deliveries.mealOccurrenceId, occurrenceId),
    });

    if (!existingDelivery) {
      await db.insert(deliveries).values({
        mealOccurrenceId: occurrenceId,
        status: input.status === 'READY' ? 'ASSIGNED' : 'PENDING',
      });
    } else if (input.status === 'READY' && existingDelivery.status === 'PENDING') {
      await db
        .update(deliveries)
        .set({ status: 'ASSIGNED' })
        .where(eq(deliveries.id, existingDelivery.id));
    }

    return updated;
  }

  /**
   * List active subscribers and portion quantities.
   */
  async getProviderSubscribers(providerId: string) {
    const activeSubs = await db.query.subscriptions.findMany({
      where: and(
        eq(subscriptions.providerId, providerId),
        notInArray(subscriptions.status, ['DRAFT', 'CANCELLED'])
      ),
      with: {
        customer: true,
        location: true,
        schedule: {
          with: {
            defaultMenuItem: true,
          },
        },
      },
      orderBy: [desc(subscriptions.createdAt)],
    });

    return activeSubs.map((sub) => ({
      subscriptionId: sub.id,
      customer: {
        id: sub.customer.id,
        name: sub.customer.name,
        phone: sub.customer.phone,
        email: sub.customer.email,
      },
      location: {
        id: sub.location.id,
        label: sub.location.label,
        addressLine: sub.location.addressLine,
        landmark: sub.location.landmark,
      },
      mealType: sub.mealType,
      frequency: sub.frequency,
      quantity: sub.quantity,
      status: sub.status,
      startDate: sub.startDate,
      endDate: sub.endDate,
      totalPrice: sub.totalPrice,
      activeDays: sub.schedule.map((s) => s.dayOfWeek),
      defaultDish: sub.schedule[0]?.defaultMenuItem?.name || 'Standard Dish',
    }));
  }

  /**
   * Read-only earnings summary for Phase 3.
   */
  async getProviderEarningsSummary(providerId: string, fromDate?: string, toDate?: string) {
    const conditions = [
      eq(mealOccurrences.providerId, providerId),
      eq(mealOccurrences.status, 'DELIVERED'),
    ];

    if (fromDate) {
      conditions.push(gte(mealOccurrences.scheduledDate, fromDate));
    }
    if (toDate) {
      conditions.push(lte(mealOccurrences.scheduledDate, toDate));
    }

    const deliveredMeals = await db.query.mealOccurrences.findMany({
      where: and(...conditions),
      with: {
        menuItem: true,
      },
      orderBy: [desc(mealOccurrences.scheduledDate)],
    });

    let grossRevenueNum = 0;
    for (const meal of deliveredMeals) {
      grossRevenueNum += parseFloat(meal.totalPrice || '0');
    }

    const platformFeeNum = grossRevenueNum * 0.1; // 10% platform commission
    const netEarningsNum = grossRevenueNum - platformFeeNum;

    // Also get active subscriber count
    const activeSubCount = await db.$count(
      subscriptions,
      and(eq(subscriptions.providerId, providerId), eq(subscriptions.status, 'ACTIVE'))
    );

    return {
      completedMealsCount: deliveredMeals.length,
      activeSubscribers: activeSubCount,
      grossRevenue: grossRevenueNum.toFixed(2),
      platformFee: platformFeeNum.toFixed(2),
      netEarnings: netEarningsNum.toFixed(2),
      currency: 'NPR',
      recentCompletedMeals: deliveredMeals.slice(0, 10).map((m) => ({
        id: m.id,
        date: m.scheduledDate,
        dishName: m.menuItem.name,
        quantity: m.quantity,
        totalPrice: m.totalPrice,
      })),
    };
  }
}

export const providerOperationsService = new ProviderOperationsService();
