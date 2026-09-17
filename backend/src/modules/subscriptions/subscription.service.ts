import { eq, and, desc, gte } from 'drizzle-orm';
import { db } from '../../db/index.js';
import {
  subscriptions,
  subscriptionSchedules,
  mealOccurrences,
  providers,
  menuItems,
  customerLocations,
} from '../../db/schema/index.js';
import {
  NotFoundError,
  ForbiddenError,
  BusinessRuleError,
} from '../../shared/errors/AppError.js';
import { locationService } from '../locations/location.service.js';
import { subscriptionEngine } from './subscriptionEngine.js';
import type { CreateSubscriptionInput } from '@gharkhana/validation';

export class SubscriptionService {
  async createSubscription(customerId: string, input: CreateSubscriptionInput) {
    // 1. Validate Provider status
    const provider = await db.query.providers.findFirst({
      where: eq(providers.id, input.providerId),
      with: {
        cutoffPolicies: true,
      },
    });

    if (!provider) {
      throw new NotFoundError('Provider not found', 'PROVIDER_NOT_FOUND');
    }

    if (provider.verificationStatus !== 'VERIFIED' || provider.status !== 'ACTIVE') {
      throw new BusinessRuleError(
        'Cannot subscribe to an unverified or inactive provider',
        'PROVIDER_NOT_VERIFIED'
      );
    }

    // 2. Validate Customer Location & Serviceability
    const location = await db.query.customerLocations.findFirst({
      where: and(
        eq(customerLocations.id, input.locationId),
        eq(customerLocations.customerId, customerId)
      ),
    });

    if (!location) {
      throw new NotFoundError('Customer delivery location not found', 'LOCATION_NOT_FOUND');
    }

    const serviceability = await locationService.isLocationServiceableByProvider(
      input.locationId,
      input.providerId
    );

    if (!serviceability.serviceable) {
      throw new BusinessRuleError(
        'Selected delivery location is outside the provider active service area',
        'LOCATION_NOT_SERVICEABLE'
      );
    }

    // 3. Validate Menu Item & Authoritative Pricing
    const menuItem = await db.query.menuItems.findFirst({
      where: eq(menuItems.id, input.defaultMenuItemId),
    });

    if (!menuItem) {
      throw new NotFoundError('Default menu item not found', 'MENU_ITEM_NOT_FOUND');
    }

    if (!menuItem.availability) {
      throw new BusinessRuleError('Selected menu item is currently unavailable', 'MENU_ITEM_UNAVAILABLE');
    }

    if (menuItem.mealType !== input.mealType) {
      throw new BusinessRuleError(
        `Menu item meal type (${menuItem.mealType}) does not match subscription meal type (${input.mealType})`,
        'MEAL_TYPE_MISMATCH'
      );
    }

    // 4. Authoritative Server Calculation of Total Price
    const start = new Date(input.startDate);
    const end = new Date(input.endDate);
    const daySet = new Set(input.days);
    const unitPriceNum = parseFloat(menuItem.price);
    const quantity = input.quantity || 1;

    let totalMeals = 0;
    const cur = new Date(start);
    while (cur <= end) {
      if (daySet.has(cur.getDay())) {
        totalMeals += quantity;
      }
      cur.setDate(cur.getDate() + 1);
    }

    const totalPrice = (totalMeals * unitPriceNum).toFixed(2);

    // 5. Capacity Check
    const capConfig = provider.dailyCapacity as Record<string, number>;
    const dailyCap = capConfig[input.mealType] ?? 0;
    if (quantity > dailyCap && dailyCap > 0) {
      throw new BusinessRuleError(
        `Requested quantity (${quantity}) exceeds provider maximum capacity for ${input.mealType} (${dailyCap})`,
        'PROVIDER_CAPACITY_EXCEEDED'
      );
    }

    // Denormalized cutoff snapshot
    const activeCutoffPolicy =
      provider.cutoffPolicies.find((p) => p.mealType === input.mealType) ||
      provider.cutoffPolicies.find((p) => p.mealType === null);

    // 6. Create Subscription & Schedule in transaction
    const createdSubscription = await db.transaction(async (tx) => {
      const [sub] = await tx
        .insert(subscriptions)
        .values({
          customerId,
          providerId: input.providerId,
          locationId: input.locationId,
          startDate: input.startDate,
          endDate: input.endDate,
          frequency: input.frequency,
          mealType: input.mealType,
          quantity,
          status: 'DRAFT',
          totalPrice,
          cutoffPolicyId: activeCutoffPolicy?.id || null,
        })
        .returning();

      // Insert recurring schedule template entries for each chosen day
      const scheduleEntries = input.days.map((dow) => ({
        subscriptionId: sub.id,
        dayOfWeek: dow,
        defaultMenuItemId: input.defaultMenuItemId,
        quantity,
      }));

      await tx.insert(subscriptionSchedules).values(scheduleEntries);

      return sub;
    });

    return {
      ...createdSubscription,
      authoritativeUnitPrice: menuItem.price,
      totalMeals,
    };
  }

  async activateSubscription(subscriptionId: string, customerId?: string) {
    const sub = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.id, subscriptionId),
    });

    if (!sub) {
      throw new NotFoundError('Subscription not found', 'SUBSCRIPTION_NOT_FOUND');
    }

    if (customerId && sub.customerId !== customerId) {
      throw new ForbiddenError('You do not own this subscription', 'NOT_OWNER');
    }

    const [updated] = await db
      .update(subscriptions)
      .set({ status: 'ACTIVE', updatedAt: new Date() })
      .where(eq(subscriptions.id, subscriptionId))
      .returning();

    // Trigger immediate rolling occurrence generation
    const genResult = await subscriptionEngine.generateOccurrences(subscriptionId);

    return {
      subscription: updated,
      generation: genResult,
    };
  }

  async pauseSubscription(subscriptionId: string, customerId: string) {
    const sub = await db.query.subscriptions.findFirst({
      where: and(eq(subscriptions.id, subscriptionId), eq(subscriptions.customerId, customerId)),
    });

    if (!sub) {
      throw new NotFoundError('Subscription not found', 'SUBSCRIPTION_NOT_FOUND');
    }

    if (sub.status !== 'ACTIVE') {
      throw new BusinessRuleError('Only active subscriptions can be paused', 'INVALID_STATUS');
    }

    const [paused] = await db
      .update(subscriptions)
      .set({ status: 'PAUSED', updatedAt: new Date() })
      .where(eq(subscriptions.id, subscriptionId))
      .returning();

    return paused;
  }

  async resumeSubscription(subscriptionId: string, customerId: string) {
    const sub = await db.query.subscriptions.findFirst({
      where: and(eq(subscriptions.id, subscriptionId), eq(subscriptions.customerId, customerId)),
    });

    if (!sub) {
      throw new NotFoundError('Subscription not found', 'SUBSCRIPTION_NOT_FOUND');
    }

    if (sub.status !== 'PAUSED') {
      throw new BusinessRuleError('Only paused subscriptions can be resumed', 'INVALID_STATUS');
    }

    const [resumed] = await db
      .update(subscriptions)
      .set({ status: 'ACTIVE', updatedAt: new Date() })
      .where(eq(subscriptions.id, subscriptionId))
      .returning();

    // Re-trigger rolling generation
    const genResult = await subscriptionEngine.generateOccurrences(subscriptionId);

    return {
      subscription: resumed,
      generation: genResult,
    };
  }

  async cancelSubscription(subscriptionId: string, customerId: string) {
    const sub = await db.query.subscriptions.findFirst({
      where: and(eq(subscriptions.id, subscriptionId), eq(subscriptions.customerId, customerId)),
    });

    if (!sub) {
      throw new NotFoundError('Subscription not found', 'SUBSCRIPTION_NOT_FOUND');
    }

    const [cancelled] = await db
      .update(subscriptions)
      .set({ status: 'CANCELLED', updatedAt: new Date() })
      .where(eq(subscriptions.id, subscriptionId))
      .returning();

    // Cancel future occurrences that haven't been prepared yet
    const todayStr = new Date().toISOString().split('T')[0];
    await db
      .update(mealOccurrences)
      .set({ status: 'CANCELLED', updatedAt: new Date() })
      .where(
        and(
          eq(mealOccurrences.subscriptionId, subscriptionId),
          eq(mealOccurrences.status, 'SCHEDULED'),
          gte(mealOccurrences.scheduledDate, todayStr)
        )
      );

    return cancelled;
  }

  async getSubscriptionById(subscriptionId: string, customerId: string) {
    const sub = await db.query.subscriptions.findFirst({
      where: and(eq(subscriptions.id, subscriptionId), eq(subscriptions.customerId, customerId)),
      with: {
        provider: true,
        location: true,
        schedule: {
          with: {
            defaultMenuItem: true,
          },
        },
      },
    });

    if (!sub) {
      throw new NotFoundError('Subscription not found', 'SUBSCRIPTION_NOT_FOUND');
    }

    return sub;
  }

  async listCustomerSubscriptions(customerId: string) {
    return db.query.subscriptions.findMany({
      where: eq(subscriptions.customerId, customerId),
      with: {
        provider: true,
        location: true,
        schedule: {
          with: {
            defaultMenuItem: true,
          },
        },
      },
      orderBy: [desc(subscriptions.createdAt)],
    });
  }
}

export const subscriptionService = new SubscriptionService();
