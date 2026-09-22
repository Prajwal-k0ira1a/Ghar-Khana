import { eq, and } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { reviews, subscriptions, providers } from '../../db/schema/index.js';
import {
  NotFoundError,
  ConflictError,
  BusinessRuleError,
} from '../../shared/errors/AppError.js';
import { recordAudit } from '../../shared/audit/recordAudit.js';
import type { CreateReviewInput } from '@gharkhana/validation';

/**
 * Phase 7 marketplace trust (PRD FR-18, DOMAIN_MODEL.md §18).
 * One review per subscription; provider rating is denormalized.
 */
export class ReviewService {
  async createReview(customerId: string, input: CreateReviewInput) {
    const subscription = await db.query.subscriptions.findFirst({
      where: and(
        eq(subscriptions.id, input.subscriptionId),
        eq(subscriptions.customerId, customerId)
      ),
    });
    if (!subscription) {
      throw new NotFoundError('Subscription not found', 'SUBSCRIPTION_NOT_FOUND');
    }
    if (subscription.status !== 'COMPLETED' && subscription.status !== 'ACTIVE') {
      throw new BusinessRuleError(
        'Reviews can only be left on active or completed subscriptions',
        'INVALID_SUBSCRIPTION_STATUS'
      );
    }
    const existing = await db.query.reviews.findFirst({
      where: eq(reviews.subscriptionId, input.subscriptionId),
    });
    if (existing) {
      throw new ConflictError('A review already exists for this subscription', 'REVIEW_EXISTS');
    }

    const [review] = await db
      .insert(reviews)
      .values({
        customerId,
        providerId: subscription.providerId,
        subscriptionId: input.subscriptionId,
        rating: input.rating,
        comment: input.comment ?? null,
      })
      .returning();

    await this.recomputeProviderRating(subscription.providerId);
    await recordAudit({
      actorUserId: customerId,
      action: 'review.created',
      entityType: 'review',
      entityId: review.id,
      afterState: { rating: input.rating, providerId: subscription.providerId },
    });
    return review;
  }

  async listProviderReviews(providerId: string) {
    const provider = await db.query.providers.findFirst({
      where: eq(providers.id, providerId),
    });
    if (!provider) throw new NotFoundError('Provider not found', 'PROVIDER_NOT_FOUND');
    return db.query.reviews.findMany({
      where: and(eq(reviews.providerId, providerId), eq(reviews.status, 'PUBLISHED')),
      orderBy: (r, { desc }) => [desc(r.createdAt)],
    });
  }

  async moderateReview(adminId: string, reviewId: string, status: 'PUBLISHED' | 'FLAGGED' | 'REMOVED') {
    const existing = await db.query.reviews.findFirst({
      where: eq(reviews.id, reviewId),
    });
    if (!existing) throw new NotFoundError('Review not found', 'REVIEW_NOT_FOUND');
    const [updated] = await db
      .update(reviews)
      .set({ status: status as never })
      .where(eq(reviews.id, reviewId))
      .returning();
    await this.recomputeProviderRating(existing.providerId);
    await recordAudit({
      actorUserId: adminId,
      action: 'review.moderated',
      entityType: 'review',
      entityId: reviewId,
      beforeState: { status: existing.status },
      afterState: { status },
    });
    return updated;
  }

  private async recomputeProviderRating(providerId: string): Promise<void> {
    const rows = await db.query.reviews.findMany({
      where: and(eq(reviews.providerId, providerId), eq(reviews.status, 'PUBLISHED')),
    });
    const count = rows.length;
    const avg =
      count === 0 ? null : (rows.reduce((sum, r) => sum + r.rating, 0) / count).toFixed(1);
    await db
      .update(providers)
      .set({
        rating: avg as never,
        ratingCount: count,
        updatedAt: new Date(),
      })
      .where(eq(providers.id, providerId));
  }
}

export const reviewService = new ReviewService();

export const __test__ = { average: (ratings: number[]): string | null => {
  if (ratings.length === 0) return null;
  return (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1);
} };
