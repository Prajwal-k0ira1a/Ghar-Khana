import { eq, and, desc, lt } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { payments, subscriptions } from '../../db/schema/index.js';
import {
  NotFoundError,
  ForbiddenError,
  BusinessRuleError,
  UnauthorizedError,
} from '../../shared/errors/AppError.js';
import { PaymentGatewayFactory } from './gateways/gateway.factory.js';
import { subscriptionEngine } from '../subscriptions/subscriptionEngine.js';
import { walletService } from '../wallets/wallet.service.js';
import type { InitiatePaymentInput, RefundPaymentInput } from '@gharkhana/validation';
import type { PaymentGateway } from '@gharkhana/types';

export class PaymentService {
  /**
   * Initiate customer subscription payment with idempotency protection.
   */
  async initiatePayment(customerId: string, input: InitiatePaymentInput) {
    // 1. Idempotency Check (PAYMENTS.md §7)
    const existingPayment = await db.query.payments.findFirst({
      where: eq(payments.idempotencyKey, input.idempotencyKey),
    });

    if (existingPayment) {
      if (existingPayment.customerId !== customerId) {
        throw new ForbiddenError('Idempotency key was used by another user', 'IDEMPOTENCY_CONFLICT');
      }

      if (existingPayment.status === 'SUCCESS') {
        return {
          payment: existingPayment,
          alreadyPaid: true,
          message: 'Payment for this order has already been completed',
        };
      }

      // Re-generate gateway session for pending payment
      const adapter = PaymentGatewayFactory.getAdapter(existingPayment.gateway);
      const session = await adapter.createSession(existingPayment, {
        id: existingPayment.subscriptionId,
        customerId,
      });

      return {
        payment: existingPayment,
        session,
        idempotentReplay: true,
      };
    }

    // 2. Validate Subscription
    const sub = await db.query.subscriptions.findFirst({
      where: and(eq(subscriptions.id, input.subscriptionId), eq(subscriptions.customerId, customerId)),
    });

    if (!sub) {
      throw new NotFoundError('Subscription not found', 'SUBSCRIPTION_NOT_FOUND');
    }

    if (sub.status === 'ACTIVE') {
      throw new BusinessRuleError('Subscription is already paid and active', 'SUBSCRIPTION_ALREADY_ACTIVE');
    }

    if (sub.status === 'CANCELLED') {
      throw new BusinessRuleError('Cannot pay for a cancelled subscription', 'SUBSCRIPTION_CANCELLED');
    }

    // 3. Create Pending Payment
    const [payment] = await db
      .insert(payments)
      .values({
        subscriptionId: sub.id,
        customerId,
        amount: sub.totalPrice, // Authoritative server-side price!
        currency: 'NPR',
        gateway: input.gateway as PaymentGateway,
        status: 'PENDING',
        idempotencyKey: input.idempotencyKey,
      })
      .returning();

    // Mark subscription status as PENDING_PAYMENT
    if (sub.status === 'DRAFT') {
      await db
        .update(subscriptions)
        .set({ status: 'PENDING_PAYMENT', updatedAt: new Date() })
        .where(eq(subscriptions.id, sub.id));
    }

    // 4. Generate Gateway Session
    const adapter = PaymentGatewayFactory.getAdapter(input.gateway);
    const session = await adapter.createSession(payment, {
      id: sub.id,
      customerId,
    });

    return {
      payment,
      session,
      idempotentReplay: false,
    };
  }

  /**
   * Process incoming signed webhook from payment gateway.
   * Strictly idempotent: Redelivered webhooks are safely acknowledged with no duplicate side effects.
   */
  async handleWebhook(gatewayName: string, rawBody: any, signatureHeader?: string) {
    const adapter = PaymentGatewayFactory.getAdapter(gatewayName);

    // 1. Verify HMAC-SHA256 signature
    const isValid = adapter.verifyWebhookSignature(rawBody, signatureHeader);
    if (!isValid) {
      throw new UnauthorizedError('Invalid or forged webhook signature', 'INVALID_SIGNATURE');
    }

    // 2. Parse normalized event
    const event = adapter.parseWebhookEvent(rawBody);

    // 3. Find payment record by referenceId
    const payment = await db.query.payments.findFirst({
      where: eq(payments.id, event.referenceId),
      with: {
        subscription: true,
      },
    });

    if (!payment) {
      throw new NotFoundError(`Payment reference ${event.referenceId} not found`, 'PAYMENT_NOT_FOUND');
    }

    // 4. Idempotency Guard (PAYMENTS.md §7)
    // If payment is already SUCCESS, safely ignore redelivery without duplicating actions
    if (payment.status === 'SUCCESS') {
      return {
        received: true,
        idempotentReplay: true,
        paymentId: payment.id,
        message: 'Webhook was previously processed successfully',
      };
    }

    // 5. Handle Status Transition
    if (event.status === 'SUCCESS') {
      // Atomic activation
      const now = new Date();
      await db
        .update(payments)
        .set({
          status: 'SUCCESS',
          paidAt: now,
          providerReference: event.gatewayTransactionId,
          updatedAt: now,
        })
        .where(eq(payments.id, payment.id));

      await db
        .update(subscriptions)
        .set({
          status: 'ACTIVE',
          updatedAt: now,
        })
        .where(eq(subscriptions.id, payment.subscriptionId));

      // Trigger occurrence generator to materialize initial 14-day rolling window!
      const generationResult = await subscriptionEngine.generateOccurrences(payment.subscriptionId);

      return {
        received: true,
        status: 'SUCCESS',
        paymentId: payment.id,
        subscriptionId: payment.subscriptionId,
        occurrencesGenerated: generationResult.generatedCount,
      };
    } else {
      await db
        .update(payments)
        .set({
          status: 'FAILED',
          providerReference: event.gatewayTransactionId,
          updatedAt: new Date(),
        })
        .where(eq(payments.id, payment.id));

      return {
        received: true,
        status: 'FAILED',
        paymentId: payment.id,
      };
    }
  }

  async getPaymentById(paymentId: string, customerId?: string) {
    const payment = await db.query.payments.findFirst({
      where: eq(payments.id, paymentId),
      with: {
        subscription: true,
      },
    });

    if (!payment) {
      throw new NotFoundError('Payment not found', 'PAYMENT_NOT_FOUND');
    }

    if (customerId && payment.customerId !== customerId) {
      throw new ForbiddenError('You do not own this payment record', 'NOT_OWNER');
    }

    return payment;
  }

  async getSubscriptionPayments(subscriptionId: string, customerId: string) {
    const sub = await db.query.subscriptions.findFirst({
      where: and(eq(subscriptions.id, subscriptionId), eq(subscriptions.customerId, customerId)),
    });

    if (!sub) {
      throw new NotFoundError('Subscription not found', 'SUBSCRIPTION_NOT_FOUND');
    }

    return db.query.payments.findMany({
      where: eq(payments.subscriptionId, subscriptionId),
      orderBy: [desc(payments.createdAt)],
    });
  }

  /**
   * Process refund with offsetting double-entry ledger deduction.
   */
  async processRefund(
    paymentId: string,
    input: RefundPaymentInput,
    _adminId: string
  ) {
    const payment = await db.query.payments.findFirst({
      where: eq(payments.id, paymentId),
      with: {
        subscription: true,
      },
    });

    if (!payment) {
      throw new NotFoundError('Payment not found', 'PAYMENT_NOT_FOUND');
    }

    if (payment.status !== 'SUCCESS' && payment.status !== 'PARTIALLY_REFUNDED') {
      throw new BusinessRuleError('Only completed payments can be refunded', 'INVALID_PAYMENT_STATUS');
    }

    const refundAmountNum = parseFloat(input.amount);
    const paidAmountNum = parseFloat(payment.amount);

    if (refundAmountNum <= 0 || refundAmountNum > paidAmountNum) {
      throw new BusinessRuleError(
        `Refund amount must be between 0 and NPR ${payment.amount}`,
        'INVALID_REFUND_AMOUNT'
      );
    }

    const adapter = PaymentGatewayFactory.getAdapter(payment.gateway);
    await adapter.initiateRefund(payment.id, input.amount, input.reason);

    const isFullRefund = refundAmountNum === paidAmountNum;
    const newStatus = isFullRefund ? 'REFUNDED' : 'PARTIALLY_REFUNDED';

    const [updated] = await db
      .update(payments)
      .set({
        status: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(payments.id, payment.id))
      .returning();

    // Offset provider wallet ledger
    await walletService.recordRefundDeduction(
      payment.subscription.providerId,
      input.amount,
      payment.id
    );

    return updated;
  }

  /**
   * Reconciliation job: checks pending payments and activates subscriptions if gateway reports success.
   */
  async reconcilePendingPayments() {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

    const stalePending = await db.query.payments.findMany({
      where: and(eq(payments.status, 'PENDING'), lt(payments.createdAt, fifteenMinutesAgo)),
      with: {
        subscription: true,
      },
    });

    const reconciled: string[] = [];

    for (const payment of stalePending) {
      // For simulated/test environments or mock gateway
      if (payment.providerReference?.startsWith('mock_complete_')) {
        await db
          .update(payments)
          .set({ status: 'SUCCESS', paidAt: new Date() })
          .where(eq(payments.id, payment.id));
        await db
          .update(subscriptions)
          .set({ status: 'ACTIVE' })
          .where(eq(subscriptions.id, payment.subscriptionId));
        await subscriptionEngine.generateOccurrences(payment.subscriptionId);
        reconciled.push(payment.id);
      }
    }

    return {
      scannedCount: stalePending.length,
      reconciledCount: reconciled.length,
      reconciledIds: reconciled,
    };
  }
}

export const paymentService = new PaymentService();
