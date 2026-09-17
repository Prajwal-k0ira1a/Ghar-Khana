import { eq, and, gte, lte, asc } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { mealOccurrences, subscriptions, menuItems } from '../../db/schema/index.js';
import {
  NotFoundError,
  ForbiddenError,
  BusinessRuleError,
} from '../../shared/errors/AppError.js';
import type { CustomizeMealInput } from '@gharkhana/validation';

export class MealOccurrenceService {
  async getSubscriptionMeals(
    subscriptionId: string,
    customerId: string,
    fromDate?: string,
    toDate?: string
  ) {
    const sub = await db.query.subscriptions.findFirst({
      where: and(eq(subscriptions.id, subscriptionId), eq(subscriptions.customerId, customerId)),
    });

    if (!sub) {
      throw new NotFoundError('Subscription not found', 'SUBSCRIPTION_NOT_FOUND');
    }

    const conditions = [eq(mealOccurrences.subscriptionId, subscriptionId)];
    if (fromDate) {
      conditions.push(gte(mealOccurrences.scheduledDate, fromDate));
    }
    if (toDate) {
      conditions.push(lte(mealOccurrences.scheduledDate, toDate));
    }

    const occurrences = await db.query.mealOccurrences.findMany({
      where: and(...conditions),
      with: {
        menuItem: true,
        delivery: true,
      },
      orderBy: [asc(mealOccurrences.scheduledDate)],
    });

    const now = new Date();

    return occurrences.map((occ) => {
      const isPastCutoff = now >= occ.cutoffAt;
      let glyph = '✓';
      let variant: 'confirmed' | 'customized' | 'skipped' | 'warning' = 'confirmed';

      if (occ.status === 'SKIPPED') {
        glyph = '—';
        variant = 'skipped';
      } else if (occ.customizationSource === 'CUSTOMER_OVERRIDE') {
        glyph = '✎';
        variant = 'customized';
      } else if (!isPastCutoff && occ.cutoffAt.getTime() - now.getTime() < 4 * 60 * 60 * 1000) {
        // Less than 4 hours to cutoff
        glyph = '!';
        variant = 'warning';
      }

      return {
        ...occ,
        isPastCutoff,
        glyph,
        variant,
      };
    });
  }

  async getMealById(occurrenceId: string, customerId: string) {
    const occ = await db.query.mealOccurrences.findFirst({
      where: eq(mealOccurrences.id, occurrenceId),
      with: {
        subscription: true,
        menuItem: true,
        delivery: true,
      },
    });

    if (!occ) {
      throw new NotFoundError('Meal occurrence not found', 'MEAL_NOT_FOUND');
    }

    if (occ.subscription.customerId !== customerId) {
      throw new ForbiddenError('You do not own this meal occurrence', 'NOT_OWNER');
    }

    return occ;
  }

  async customizeMeal(
    occurrenceId: string,
    customerId: string,
    input: CustomizeMealInput
  ) {
    const occ = await this.getMealById(occurrenceId, customerId);

    // 1. Subscription must be active
    if (occ.subscription.status !== 'ACTIVE') {
      throw new BusinessRuleError(
        'Cannot customize meals for a non-active subscription',
        'INVALID_SUBSCRIPTION_STATUS'
      );
    }

    // 2. CRITICAL CUTOFF CHECK (SUBSCRIPTION_ENGINE.md §9)
    const now = new Date();
    if (now >= occ.cutoffAt) {
      throw new BusinessRuleError(
        'This meal can no longer be modified because the provider cutoff has passed',
        'MODIFICATION_CUTOFF_PASSED',
        { cutoffAt: occ.cutoffAt.toISOString() }
      );
    }

    // 3. Validate new menuItem
    const newItem = await db.query.menuItems.findFirst({
      where: eq(menuItems.id, input.menuItemId),
    });

    if (!newItem) {
      throw new NotFoundError('Selected menu item not found', 'MENU_ITEM_NOT_FOUND');
    }

    if (!newItem.availability) {
      throw new BusinessRuleError('Selected menu item is unavailable', 'MENU_ITEM_UNAVAILABLE');
    }

    const qty = input.quantity || occ.quantity;
    const unitPriceNum = parseFloat(newItem.price);
    const totalPrice = (unitPriceNum * qty).toFixed(2);

    // 4. Update MealOccurrence row ONLY (Schedule template in subscription_schedules remains untouched)
    const [updated] = await db
      .update(mealOccurrences)
      .set({
        menuItemId: newItem.id,
        quantity: qty,
        unitPrice: newItem.price,
        totalPrice,
        customizationSource: 'CUSTOMER_OVERRIDE',
        updatedAt: new Date(),
      })
      .where(eq(mealOccurrences.id, occurrenceId))
      .returning();

    return updated;
  }

  async skipMeal(occurrenceId: string, customerId: string) {
    const occ = await this.getMealById(occurrenceId, customerId);

    const now = new Date();
    if (now >= occ.cutoffAt) {
      throw new BusinessRuleError(
        'This meal can no longer be skipped because the provider cutoff has passed',
        'MODIFICATION_CUTOFF_PASSED',
        { cutoffAt: occ.cutoffAt.toISOString() }
      );
    }

    const [skipped] = await db
      .update(mealOccurrences)
      .set({
        status: 'SKIPPED',
        updatedAt: new Date(),
      })
      .where(eq(mealOccurrences.id, occurrenceId))
      .returning();

    return skipped;
  }

  async restoreMeal(occurrenceId: string, customerId: string) {
    const occ = await this.getMealById(occurrenceId, customerId);

    const now = new Date();
    if (now >= occ.cutoffAt) {
      throw new BusinessRuleError(
        'This meal can no longer be modified because the provider cutoff has passed',
        'MODIFICATION_CUTOFF_PASSED',
        { cutoffAt: occ.cutoffAt.toISOString() }
      );
    }

    const [restored] = await db
      .update(mealOccurrences)
      .set({
        status: 'SCHEDULED',
        updatedAt: new Date(),
      })
      .where(eq(mealOccurrences.id, occurrenceId))
      .returning();

    return restored;
  }
}

export const mealOccurrenceService = new MealOccurrenceService();
