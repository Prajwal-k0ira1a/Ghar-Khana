import { eq, and } from 'drizzle-orm';
import { db } from '../../db/index.js';
import {
  deliveries,
  mealOccurrences,
  providers,
} from '../../db/schema/index.js';
import {
  NotFoundError,
  ForbiddenError,
  BusinessRuleError,
} from '../../shared/errors/AppError.js';
import { recordAudit } from '../../shared/audit/recordAudit.js';
import type { AssignDeliveryInput, DeliveryFailureInput } from '@gharkhana/validation';

type Role = 'CUSTOMER' | 'PROVIDER' | 'DELIVERY_PARTNER' | 'ADMIN' | 'SUPER_ADMIN';

export const TERMINAL_DELIVERY_STATUSES = ['DELIVERED', 'FAILED', 'CANCELLED'] as const;

/** Pure transition table (DELIVERY.md §3) — unit-tested without a database. */
export const DELIVERY_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['ASSIGNED', 'FAILED', 'CANCELLED'],
  ASSIGNED: ['PICKED_UP', 'DELIVERED', 'FAILED', 'CANCELLED'],
  PICKED_UP: ['OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'FAILED'],
  DELIVERED: [],
  FAILED: [],
  CANCELLED: [],
};

export const canTransitionDelivery = (from: string, to: string): boolean =>
  DELIVERY_TRANSITIONS[from]?.includes(to) ?? false;

/** Delivery → occurrence mirror (DELIVERY.md §3: occurrence stays canonical). */
export const mirrorOccurrenceStatus = (deliveryStatus: string): string | null => {
  switch (deliveryStatus) {
    case 'PICKED_UP':
      return 'PICKED_UP';
    case 'DELIVERED':
      return 'DELIVERED';
    case 'FAILED':
      return 'FAILED';
    case 'CANCELLED':
      return 'CANCELLED';
    default:
      return null;
  }
};

/**
 * Phase 5 delivery state machine (DELIVERY.md §3).
 * Delivery.status transitions are mirrored into MealOccurrence.status
 * so the occurrence stays the canonical "where is my meal" answer.
 */
export class DeliveryService {
  private async loadDelivery(deliveryId: string) {
    const delivery = await db.query.deliveries.findFirst({
      where: eq(deliveries.id, deliveryId),
      with: {
        mealOccurrence: {
          with: {
            subscription: {
              with: { location: true },
            },
          },
        },
        deliveryPartner: true,
      },
    });
    if (!delivery) throw new NotFoundError('Delivery not found', 'DELIVERY_NOT_FOUND');
    return delivery;
  }

  private async assertAccess(
    delivery: Awaited<ReturnType<DeliveryService['loadDelivery']>>,
    userId: string,
    role: Role
  ) {
    if (role === 'ADMIN' || role === 'SUPER_ADMIN') return;
    const sub = delivery.mealOccurrence.subscription;
    if (role === 'CUSTOMER' && sub.customerId !== userId) {
      throw new ForbiddenError('You do not own this delivery', 'NOT_OWNER');
    }
    if (role === 'DELIVERY_PARTNER' && delivery.deliveryPartnerId !== userId) {
      throw new ForbiddenError('Delivery is not assigned to you', 'NOT_OWNER');
    }
    if (role === 'PROVIDER') {
      const provider = await db.query.providers.findFirst({
        where: eq(providers.userId, userId),
      });
      if (!provider || sub.providerId !== provider.id) {
        throw new ForbiddenError('Delivery does not belong to your kitchen', 'NOT_OWNER');
      }
    }
  }

  /** Address privacy projection (SECURITY.md §4, DELIVERY.md §4). */
  private project(
    delivery: Awaited<ReturnType<DeliveryService['loadDelivery']>>,
    role: Role
  ) {
    const { deliveryPartner, mealOccurrence, ...rest } = delivery;
    const location = mealOccurrence.subscription.location;
    if (role === 'CUSTOMER') {
      return {
        ...rest,
        partnerName: deliveryPartner ? deliveryPartner.name.split(' ')[0] : null,
        mealOccurrenceId: mealOccurrence.id,
        scheduledDate: mealOccurrence.scheduledDate,
        occurrenceStatus: mealOccurrence.status,
      };
    }
    return {
      ...rest,
      partnerName: deliveryPartner?.name ?? null,
      deliveryAddress: {
        addressLine: location.addressLine,
        landmark: location.landmark,
        instructions: location.instructions,
      },
      mealOccurrenceId: mealOccurrence.id,
      scheduledDate: mealOccurrence.scheduledDate,
      occurrenceStatus: mealOccurrence.status,
    };
  }

  async listDeliveries(userId: string, role: Role, filters: { status?: string; date?: string }) {
    const all = await db.query.deliveries.findMany({
      with: {
        mealOccurrence: { with: { subscription: { with: { location: true } } } },
        deliveryPartner: true,
      },
      orderBy: (d, { desc }) => [desc(d.assignedAt)],
    });

    let scoped = all;
    if (role === 'CUSTOMER') {
      scoped = all.filter((d) => d.mealOccurrence.subscription.customerId === userId);
    } else if (role === 'DELIVERY_PARTNER') {
      scoped = all.filter((d) => d.deliveryPartnerId === userId);
    } else if (role === 'PROVIDER') {
      const provider = await db.query.providers.findFirst({
        where: eq(providers.userId, userId),
      });
      scoped = provider
        ? all.filter((d) => d.mealOccurrence.subscription.providerId === provider.id)
        : [];
    }
    if (filters.status) scoped = scoped.filter((d) => d.status === filters.status);
    if (filters.date) {
      scoped = scoped.filter((d) => d.mealOccurrence.scheduledDate === filters.date);
    }
    return scoped.map((d) => this.project(d, role));
  }

  async getDeliveryById(deliveryId: string, userId: string, role: Role) {
    const delivery = await this.loadDelivery(deliveryId);
    await this.assertAccess(delivery, userId, role);
    return this.project(delivery, role);
  }

  async acceptDelivery(deliveryId: string, userId: string, role: Role, input: AssignDeliveryInput) {
    const delivery = await this.loadDelivery(deliveryId);
    if (delivery.status !== 'PENDING') {
      throw new BusinessRuleError(
        `Delivery cannot be accepted from status ${delivery.status}`,
        'INVALID_DELIVERY_STATUS'
      );
    }
    const partnerId = role === 'DELIVERY_PARTNER' ? userId : (input.deliveryPartnerId ?? userId);
    const [updated] = await db
      .update(deliveries)
      .set({ status: 'ASSIGNED', deliveryPartnerId: partnerId, assignedAt: new Date() })
      .where(eq(deliveries.id, deliveryId))
      .returning();
    await recordAudit({
      actorUserId: userId,
      action: 'delivery.assigned',
      entityType: 'delivery',
      entityId: deliveryId,
      beforeState: { status: delivery.status },
      afterState: { status: 'ASSIGNED', deliveryPartnerId: partnerId },
    });
    return updated;
  }

  async markPickedUp(deliveryId: string, userId: string, role: Role) {
    const delivery = await this.loadDelivery(deliveryId);
    await this.assertAccess(delivery, userId, role);
    if (delivery.status !== 'ASSIGNED') {
      throw new BusinessRuleError(
        `Delivery cannot be picked up from status ${delivery.status}`,
        'INVALID_DELIVERY_STATUS'
      );
    }
    const [updated] = await db
      .update(deliveries)
      .set({ status: 'PICKED_UP', pickedUpAt: new Date() })
      .where(eq(deliveries.id, deliveryId))
      .returning();
    await db
      .update(mealOccurrences)
      .set({ status: 'PICKED_UP', updatedAt: new Date() })
      .where(eq(mealOccurrences.id, delivery.mealOccurrenceId));
    await recordAudit({
      actorUserId: userId,
      action: 'delivery.picked_up',
      entityType: 'delivery',
      entityId: deliveryId,
      beforeState: { status: delivery.status },
      afterState: { status: 'PICKED_UP' },
    });
    return updated;
  }

  async markDelivered(deliveryId: string, userId: string, role: Role) {
    const delivery = await this.loadDelivery(deliveryId);
    await this.assertAccess(delivery, userId, role);
    if (
      delivery.status !== 'ASSIGNED' &&
      delivery.status !== 'PICKED_UP' &&
      delivery.status !== 'OUT_FOR_DELIVERY'
    ) {
      throw new BusinessRuleError(
        `Delivery cannot be completed from status ${delivery.status}`,
        'INVALID_DELIVERY_STATUS'
      );
    }
    const [updated] = await db
      .update(deliveries)
      .set({ status: 'DELIVERED', deliveredAt: new Date() })
      .where(eq(deliveries.id, deliveryId))
      .returning();
    await db
      .update(mealOccurrences)
      .set({ status: 'DELIVERED', updatedAt: new Date() })
      .where(eq(mealOccurrences.id, delivery.mealOccurrenceId));
    await recordAudit({
      actorUserId: userId,
      action: 'delivery.delivered',
      entityType: 'delivery',
      entityId: deliveryId,
      beforeState: { status: delivery.status },
      afterState: { status: 'DELIVERED' },
    });
    return updated;
  }

  async markFailed(
    deliveryId: string,
    userId: string,
    role: Role,
    input: DeliveryFailureInput
  ) {
    const delivery = await this.loadDelivery(deliveryId);
    await this.assertAccess(delivery, userId, role);
    if ((TERMINAL_DELIVERY_STATUSES as readonly string[]).includes(delivery.status)) {
      throw new BusinessRuleError(
        `Delivery already in terminal status ${delivery.status}`,
        'INVALID_DELIVERY_STATUS'
      );
    }
    const [updated] = await db
      .update(deliveries)
      .set({
        status: 'FAILED',
        failureReason: input.failureReason as never,
        deliveryNotes: input.deliveryNotes ?? null,
      })
      .where(eq(deliveries.id, deliveryId))
      .returning();
    await db
      .update(mealOccurrences)
      .set({ status: 'FAILED', updatedAt: new Date() })
      .where(eq(mealOccurrences.id, delivery.mealOccurrenceId));
    await recordAudit({
      actorUserId: userId,
      action: 'delivery.failed',
      entityType: 'delivery',
      entityId: deliveryId,
      beforeState: { status: delivery.status },
      afterState: { status: 'FAILED', failureReason: input.failureReason },
    });
    return updated;
  }

  async cancelDelivery(deliveryId: string, userId: string, role: Role) {
    const delivery = await this.loadDelivery(deliveryId);
    await this.assertAccess(delivery, userId, role);
    if ((TERMINAL_DELIVERY_STATUSES as readonly string[]).includes(delivery.status)) {
      throw new BusinessRuleError(
        `Delivery already in terminal status ${delivery.status}`,
        'INVALID_DELIVERY_STATUS'
      );
    }
    const [updated] = await db
      .update(deliveries)
      .set({ status: 'CANCELLED' })
      .where(eq(deliveries.id, deliveryId))
      .returning();
    await db
      .update(mealOccurrences)
      .set({ status: 'CANCELLED', updatedAt: new Date() })
      .where(
        and(
          eq(mealOccurrences.id, delivery.mealOccurrenceId),
          eq(mealOccurrences.subscriptionId, delivery.mealOccurrence.subscriptionId)
        )
      );
    await recordAudit({
      actorUserId: userId,
      action: 'delivery.cancelled',
      entityType: 'delivery',
      entityId: deliveryId,
      beforeState: { status: delivery.status },
      afterState: { status: 'CANCELLED' },
    });
    return updated;
  }
}

export const deliveryService = new DeliveryService();
