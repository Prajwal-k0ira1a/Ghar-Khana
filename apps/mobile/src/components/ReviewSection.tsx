import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Colors, Spacing, BorderRadius } from '../theme/tokens';
import { Star } from 'lucide-react-native';
import { useProviderReviews, useCreateReview } from '../hooks/useReviews';

/**
 * Provider reviews (PRD FR-18). Renders nothing on error/empty so it is safe
 * to mount anywhere — including screens still on mock provider data.
 */
export const ReviewSection: React.FC<{ providerId: string; subscriptionId?: string }> = ({
  providerId,
  subscriptionId,
}) => {
  const { data, isLoading, isError } = useProviderReviews(providerId);
  const createReview = useCreateReview(providerId);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  if (isLoading) {
    return <ActivityIndicator color={Colors.primary} size="small" />;
  }
  if (isError || !data || data.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionHeader}>CUSTOMER REVIEWS ({data.length})</Text>
      <View style={styles.reviewsList}>
        {data.slice(0, 3).map((review, index) => (
          <View
            key={review.id}
            style={[styles.reviewRow, index > 0 && styles.reviewRowBorder]}
          >
            <View style={styles.ratingRow}>
              <Star color={Colors.warning} fill={Colors.warning} size={13} />
              <Text style={styles.ratingText}>{review.rating} / 5</Text>
            </View>
            {review.comment ? (
              <Text style={styles.comment}>{review.comment}</Text>
            ) : null}
          </View>
        ))}
      </View>
      {subscriptionId ? (
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>Leave a review</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((value) => (
              <TouchableOpacity
                key={value}
                accessibilityLabel={`Rate ${value} stars`}
                accessibilityRole="button"
                onPress={() => setRating(value)}
              >
                <Star
                  color={value <= rating ? Colors.warning : '#CBD5E1'}
                  fill={value <= rating ? Colors.warning : 'transparent'}
                  size={22}
                />
              </TouchableOpacity>
            ))}
          </View>
          <Input
            onChangeText={setComment}
            placeholder="Share your experience with the food..."
            value={comment}
          />
          <Button
            loading={createReview.isPending}
            onPress={() => {
              createReview.mutate(
                { subscriptionId, rating, comment: comment || undefined },
                { onSuccess: () => setComment('') }
              );
            }}
            size="sm"
            title="Submit review"
            variant="neutral"
          />
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing.lg,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMutedDark,
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },
  reviewsList: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.surfaceBorderDark,
    borderRadius: BorderRadius.md,
  },
  reviewRow: {
    padding: Spacing.md,
  },
  reviewRowBorder: {
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorderDark,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimaryDark,
  },
  comment: {
    fontSize: 13,
    color: Colors.textSecondaryDark,
    marginTop: 4,
    lineHeight: 18,
  },
  formContainer: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.surfaceBorderDark,
    borderRadius: BorderRadius.md,
  },
  formTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimaryDark,
    marginBottom: Spacing.xs,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: Spacing.sm,
  },
});
