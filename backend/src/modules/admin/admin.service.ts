import { eq, inArray, and, desc } from 'drizzle-orm';
import { db } from '../../db/index.js';
import {
  providers,
  providerVerificationDocuments,
  disputes,
  payments,
} from '../../db/schema/index.js';
import { NotFoundError, BusinessRuleError } from '../../shared/errors/AppError.js';
import { recordAudit } from '../../shared/audit/recordAudit.js';
import { paymentService } from '../payments/payment.service.js';
import type { ReviewProviderInput, RefundPaymentInput } from '@gharkhana/validation';

export class AdminService {
  async listPendingProviders() {
    return db.query.providers.findMany({
      where: inArray(providers.verificationStatus, ['PENDING', 'IN_REVIEW']),
      with: {
        user: true,
        verificationDocuments: true,
        serviceAreas: true,
      },
      orderBy: (p, { desc }) => [desc(p.createdAt)],
    });
  }

  async verifyProvider(adminId: string, providerId: string) {
    const provider = await db.query.providers.findFirst({
      where: eq(providers.id, providerId),
    });

    if (!provider) {
      throw new NotFoundError('Provider not found', 'PROVIDER_NOT_FOUND');
    }

    if (provider.verificationStatus === 'VERIFIED') {
      throw new BusinessRuleError('Provider is already verified', 'PROVIDER_ALREADY_VERIFIED');
    }

    // Atomic update
    const [updated] = await db
      .update(providers)
      .set({
        verificationStatus: 'VERIFIED',
        updatedAt: new Date(),
      })
      .where(eq(providers.id, providerId))
      .returning();

    // Mark documents as verified
    await db
      .update(providerVerificationDocuments)
      .set({
        status: 'VERIFIED',
        reviewedByAdminId: adminId,
        reviewedAt: new Date(),
      })
      .where(
        and(
          eq(providerVerificationDocuments.providerId, providerId),
          eq(providerVerificationDocuments.status, 'PENDING')
        )
      );

    return updated;
  }

  async rejectProvider(adminId: string, providerId: string, _input?: ReviewProviderInput) {
    const provider = await db.query.providers.findFirst({
      where: eq(providers.id, providerId),
    });

    if (!provider) {
      throw new NotFoundError('Provider not found', 'PROVIDER_NOT_FOUND');
    }

    const [updated] = await db
      .update(providers)
      .set({
        verificationStatus: 'REJECTED',
        updatedAt: new Date(),
      })
      .where(eq(providers.id, providerId))
      .returning();

    await db
      .update(providerVerificationDocuments)
      .set({
        status: 'REJECTED',
        reviewedByAdminId: adminId,
        reviewedAt: new Date(),
      })
      .where(
        and(
          eq(providerVerificationDocuments.providerId, providerId),
          eq(providerVerificationDocuments.status, 'PENDING')
        )
      );

    return updated;
  }

  async listDisputes(status?: string) {
    const rows = await db.query.disputes.findMany({
      orderBy: [desc(disputes.createdAt)],
    });
    return status ? rows.filter((d) => d.status === status) : rows;
  }

  async updateDispute(
    adminId: string,
    disputeId: string,
    input: { status: 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'REJECTED'; resolutionNote?: string }
  ) {
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

  /** API_SPEC.md §18: POST /admin/subscriptions/:id/refund */
  async refundSubscription(adminId: string, subscriptionId: string, input: RefundPaymentInput) {
    const candidates = await db.query.payments.findMany({
      where: eq(payments.subscriptionId, subscriptionId),
      orderBy: [desc(payments.createdAt)],
    });
    const target = candidates.find((p) => p.status === 'SUCCESS' || p.status === 'PARTIALLY_REFUNDED');
    if (!target) {
      throw new BusinessRuleError(
        'No refundable payment found for this subscription',
        'PAYMENT_NOT_FOUND'
      );
    }
    const refunded = await paymentService.processRefund(target.id, input, adminId);
    await recordAudit({
      actorUserId: adminId,
      action: 'subscription.refunded',
      entityType: 'subscription',
      entityId: subscriptionId,
      afterState: { paymentId: target.id, amount: input.amount, reason: input.reason },
    });
    return refunded;
  }
}

export const adminService = new AdminService();
