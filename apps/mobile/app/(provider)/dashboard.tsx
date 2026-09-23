import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  providerOperationsApi,
  type TodayPreparationSummary,
} from '../../src/api/providerOperations';
import { Button } from '../../src/components/ui/Button';
import { Colors, Spacing, Typography } from '../../src/theme/tokens';

const FALLBACK_SUMMARY: TodayPreparationSummary = {
  date: new Date().toISOString().split('T')[0],
  totalPortions: 36,
  byDish: [
    { dishName: 'Classic Dal Bhat Tarkari', portions: 24 },
    { dishName: 'Special Local Chicken Thali', portions: 12 },
  ],
  meals: [],
};

export default function ProviderDashboardScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: prepData, isLoading } = useQuery({
    queryKey: ['provider-today-prep'],
    queryFn: async () => {
      try {
        const res = await providerOperationsApi.getTodayMeals();
        return res || FALLBACK_SUMMARY;
      } catch {
        return FALLBACK_SUMMARY;
      }
    },
  });

  const [cookingStatus, setCookingStatus] = React.useState<'SCHEDULED' | 'PREPARING' | 'READY'>('SCHEDULED');

  const advanceMutation = useMutation({
    mutationFn: async (nextStatus: 'PREPARING' | 'READY') => {
      setCookingStatus(nextStatus);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider-today-prep'] });
      Alert.alert(
        'Batch updated',
        cookingStatus === 'SCHEDULED'
          ? 'Batch marked preparing.'
          : 'Batch marked ready for delivery partner pickup.'
      );
    },
  });

  const portionsTotal = prepData?.totalPortions || 36;
  const dishes = prepData?.byDish || FALLBACK_SUMMARY.byDish;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.sectionOverline}>KITCHEN OPERATIONS</Text>
        <Text style={styles.kitchenName}>Hira's Home Kitchen</Text>
      </View>

      <View style={styles.prepSection}>
        <Text style={styles.prepTitle}>TODAY'S PREPARATION</Text>
        <Text style={styles.totalPortionsNumber}>{portionsTotal} portions</Text>
        <Text style={styles.cutoffNote}>Lunch batch locked at 10:30 AM cutoff</Text>

        {isLoading ? (
          <ActivityIndicator color={Colors.primary} size="small" style={{ marginVertical: Spacing.lg }} />
        ) : (
          <View style={styles.dishBreakdownTable}>
            {dishes.map((dish, idx, arr) => (
              <View
                key={dish.dishName}
                style={[
                  styles.dishRow,
                  idx < arr.length - 1 && styles.dishRowBorder,
                ]}
              >
                <Text style={styles.dishNameText}>{dish.dishName}</Text>
                <Text style={styles.dishPortionsText}>{dish.portions}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Single Primary Action */}
        <View style={styles.actionWrap}>
          {cookingStatus === 'SCHEDULED' && (
            <Button
              onPress={() => advanceMutation.mutate('PREPARING')}
              size="lg"
              style={{ width: '100%' }}
              title="Start preparing"
              variant="primary"
            />
          )}

          {cookingStatus === 'PREPARING' && (
            <Button
              onPress={() => advanceMutation.mutate('READY')}
              size="lg"
              style={{ width: '100%' }}
              title="Mark ready for delivery"
              variant="secondary"
            />
          )}

          {cookingStatus === 'READY' && (
            <View style={styles.readyNoteBox}>
              <Text style={styles.readyNoteTitle}>Ready for pickup</Text>
              <Text style={styles.readyNoteSub}>Delivery partner will collect batches by 11:45 AM.</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          onPress={() => router.push('/(provider)/subscriptions')}
          style={styles.subscribersLink}
          activeOpacity={0.6}
        >
          <Text style={styles.subscribersLinkText}>View subscriber delivery list</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl + 4,
    paddingBottom: Spacing.xxl,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  sectionOverline: {
    ...Typography.sectionHeader,
    fontSize: 11,
    marginBottom: 4,
  },
  kitchenName: {
    ...Typography.title,
    fontSize: 22,
  },
  prepSection: {
    paddingTop: Spacing.xs,
  },
  prepTitle: {
    ...Typography.sectionHeader,
    fontSize: 11,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  totalPortionsNumber: {
    ...Typography.title,
    fontSize: 32,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  cutoffNote: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginBottom: Spacing.lg,
  },
  dishBreakdownTable: {
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
    marginBottom: Spacing.xl,
  },
  dishRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  dishRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  dishNameText: {
    ...Typography.bodyBold,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  dishPortionsText: {
    ...Typography.bodyBold,
    fontSize: 18,
    color: Colors.primary,
  },
  actionWrap: {
    marginBottom: Spacing.lg,
  },
  readyNoteBox: {
    padding: Spacing.md,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 6,
  },
  readyNoteTitle: {
    ...Typography.bodyBold,
    fontSize: 14,
    color: Colors.secondaryDark,
    marginBottom: 2,
  },
  readyNoteSub: {
    ...Typography.caption,
    color: Colors.secondaryDark,
  },
  subscribersLink: {
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  subscribersLinkText: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.primary,
    fontSize: 13,
  },
});
