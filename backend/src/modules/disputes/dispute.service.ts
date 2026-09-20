import { eq, desc } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { disputes, subscriptions } from '../../db/schema/index.js';
import { NotFoundError, ForbiddenError } from '../../shared/errors/AppError.js';
import { recordAudit } from '../../shared/audit/recordAudit.js';
import type { CreateDisputeInput, UpdateDisputeInput } from '@gharkhana/validation';

/** Customer/provider dispute lifecycle (DOMAIN_MODEL.md §20, DELIVERY.md §7). */
export class DisputeService {
  async raiseDispute(userId: string, input: CreateDisputeInput) {
    const subscription = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.id, input.subscriptionId),
    });
    if (!subscription) throw new NotFoundError('Subscription not found', 'SUBSCRIPTION_NOT_FOUND');
    if (subscription.customerId !== userId) {
      throw new ForbiddenError('You do not own this subscription', 'NOT_OWNER');
    }
    const [dispute] = await db
      .insert(disputes)
      .values({
        subscriptionId: input.subscriptionId,
        raisedByUserId: userId,
        category: input.category as never,
      })
      .returning();
    await recordAudit({
      actorUserId: userId,
      action: 'dispute.opened',
      entityType: 'dispute',
      entityId: dispute.id,
      afterState: { subscriptionId: input.subscriptionId, category: input.category },
    });
    return dispute;
  }

  async listMyDisputes(userId: string) {
    return db.query.disputes.findMany({
      where: eq(disputes.raisedByUserId, userId),
      orderBy: [desc(disputes.createdAt)],
    });
  }

  async listAllDisputes(status?: string) {
    const rows = await db.query.disputes.findMany({
      orderBy: [desc(disputes.createdAt)],
    });
    return status ? rows.filter((d) => d.status === status) : rows;
  }

  async updateDispute(adminId: string, disputeId: string, input: UpdateDisputeInput) {
    const existing = await db.query.disputes.findFirst({
      where: eq(disputes.id, disputeId),
    });
    if (!existing) throw new NotFoundError('Dispute not found', 'DISPUTE_NOT_FOUND');
    const patch: Record<string, unknown> = { status: input.status };
    if (input.status === 'RESOLVED' || input.status === 'REJECTED') {
      patch.resolvedByAdminId = adminId;
      patch.resolvedAt = new Date();
    }
    if (input.resolutionNote !== undefined) patch.resolutionNote = input.resolutionNote;
    const [updated] = await db
      .update(disputes)
      .set(patch as never)
      .where(eq(disputes.id, disputeId))
      .returning();
    await recordAudit({
      actorUserId: adminId,
      action: 'dispute.resolved',
      entityType: 'dispute',
      entityId: disputeId,
      beforeState: { status: existing.status },
      afterState: { status: input.status },
    });
    return updated;
  }
}

export const disputeService = new DisputeService();
