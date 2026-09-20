import { eq, desc } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { wallets, ledgerEntries, providerPayouts } from '../../db/schema/index.js';
import { BusinessRuleError } from '../../shared/errors/AppError.js';
import type { RequestPayoutInput } from '@gharkhana/validation';

export class WalletService {
  async getOrCreateWallet(providerId: string) {
    let wallet = await db.query.wallets.findFirst({
      where: eq(wallets.providerId, providerId),
    });

    if (!wallet) {
      const [newWallet] = await db
        .insert(wallets)
        .values({
          providerId,
          balance: '0.00',
          currency: 'NPR',
        })
        .returning();
      wallet = newWallet;
    }

    return wallet;
  }

  async getWalletDetails(providerId: string) {
    const wallet = await this.getOrCreateWallet(providerId);

    const entries = await db.query.ledgerEntries.findMany({
      where: eq(ledgerEntries.walletId, wallet.id),
      orderBy: [desc(ledgerEntries.createdAt)],
      limit: 50,
    });

    const payouts = await db.query.providerPayouts.findMany({
      where: eq(providerPayouts.providerId, providerId),
      orderBy: [desc(providerPayouts.createdAt)],
      limit: 20,
    });

    return {
      walletId: wallet.id,
      balance: wallet.balance,
      currency: wallet.currency,
      ledgerEntries: entries,
      recentPayouts: payouts,
    };
  }

  /**
   * Double-entry ledger credit when a meal is delivered.
   * Credits net meal earning and logs platform commission fee.
   */
  async recordMealDeliveredCredit(
    occurrenceId: string,
    providerId: string,
    grossAmountStr: string
  ) {
    const wallet = await this.getOrCreateWallet(providerId);
    const grossNum = parseFloat(grossAmountStr);
    const feeNum = grossNum * 0.1; // 10% platform fee
    const netNum = grossNum - feeNum;

    // 1. Record MEAL_EARNING ledger entry
    await db.insert(ledgerEntries).values({
      walletId: wallet.id,
      type: 'MEAL_EARNING',
      amount: netNum.toFixed(2),
      referenceType: 'MEAL_OCCURRENCE',
      referenceId: occurrenceId,
    });

    // 2. Record PLATFORM_FEE ledger entry (audit trail)
    await db.insert(ledgerEntries).values({
      walletId: wallet.id,
      type: 'PLATFORM_FEE',
      amount: (-feeNum).toFixed(2),
      referenceType: 'MEAL_OCCURRENCE',
      referenceId: occurrenceId,
    });

    // 3. Update wallet balance
    const currentBal = parseFloat(wallet.balance || '0.00');
    const newBal = (currentBal + netNum).toFixed(2);

    const [updated] = await db
      .update(wallets)
      .set({ balance: newBal })
      .where(eq(wallets.id, wallet.id))
      .returning();

    return updated;
  }

  /**
   * Request weekly payout withdrawal.
   */
  async requestPayout(providerId: string, input: RequestPayoutInput) {
    const wallet = await this.getOrCreateWallet(providerId);
    const payoutAmountNum = parseFloat(input.amount);
    const currentBalanceNum = parseFloat(wallet.balance || '0.00');

    if (payoutAmountNum <= 0) {
      throw new BusinessRuleError('Payout amount must be greater than zero', 'INVALID_AMOUNT');
    }

    if (currentBalanceNum < payoutAmountNum) {
      throw new BusinessRuleError(
        `Insufficient wallet balance (available: NPR ${wallet.balance})`,
        'INSUFFICIENT_FUNDS'
      );
    }

    // 1. Create provider payout record
    const [payout] = await db
      .insert(providerPayouts)
      .values({
        providerId,
        amount: input.amount,
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        status: 'SCHEDULED',
      })
      .returning();

    // 2. Record PAYOUT debit ledger entry
    await db.insert(ledgerEntries).values({
      walletId: wallet.id,
      type: 'PAYOUT',
      amount: (-payoutAmountNum).toFixed(2),
      referenceType: 'PROVIDER_PAYOUT',
      referenceId: payout.id,
    });

    // 3. Deduct balance from wallet
    const newBalance = (currentBalanceNum - payoutAmountNum).toFixed(2);
    await db
      .update(wallets)
      .set({ balance: newBalance })
      .where(eq(wallets.id, wallet.id));

    return payout;
  }

  /**
   * Record refund deduction offsetting provider wallet if already credited.
   */
  async recordRefundDeduction(providerId: string, amountStr: string, referenceId: string) {
    const wallet = await this.getOrCreateWallet(providerId);
    const amountNum = parseFloat(amountStr);

    await db.insert(ledgerEntries).values({
      walletId: wallet.id,
      type: 'REFUND_DEDUCTION',
      amount: (-amountNum).toFixed(2),
      referenceType: 'MEAL_OCCURRENCE',
      referenceId,
    });

    const currentBal = parseFloat(wallet.balance || '0.00');
    const newBal = (currentBal - amountNum).toFixed(2);

    const [updated] = await db
      .update(wallets)
      .set({ balance: newBal })
      .where(eq(wallets.id, wallet.id))
      .returning();

    return updated;
  }
}

export const walletService = new WalletService();
