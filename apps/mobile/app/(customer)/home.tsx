import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../src/stores/authStore';
import { subscriptionsApi } from '../../src/api/subscriptions';
import { mealsApi } from '../../src/api/meals';
import { Button } from '../../src/components/ui/Button';
import { Colors, Spacing, Typography } from '../../src/theme/tokens';
import { ArrowRight } from 'lucide-react-native';

export default function CustomerHomeScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(new Date());

  // 1. Fetch user's subscriptions
  const { data: subscriptions, isLoading: isSubLoading } = useQuery({
    queryKey: ['my-subscriptions'],
    queryFn: async () => {
      try {
        const res = await subscriptionsApi.list();
        return res && res.length > 0 ? res : null;
      } catch {
        return null;
      }
    },
  });

  const activeSub = subscriptions?.find((s) => s.status === 'ACTIVE') || subscriptions?.[0];

  // 2. Fetch meals for active subscription
  const { data: meals } = useQuery({
    queryKey: ['subscription-meals', activeSub?.id],
    enabled: !!activeSub?.id,
    queryFn: async () => {
      try {
        const res = await subscriptionsApi.getMeals(activeSub!.id);
        return res && res.length > 0 ? res : null;
      } catch {
        return null;
      }
    },
  });

  const todayMeal = meals?.[0];
  const upcomingMeals = meals?.slice(1, 4) || [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Date Header */}
      <View style={styles.header}>
        <Text style={styles.dateLabel}>{todayFormatted.toUpperCase()}</Text>
        <Text style={styles.userName}>{user?.name ? user.name : 'Daily Meals'}</Text>
      </View>

      {/* Case 1: Empty state if no subscription */}
      {!activeSub && !isSubLoading ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No active meal subscription</Text>
          <Text style={styles.emptyDesc}>
            Subscribe to a neighborhood home kitchen for fresh meals delivered daily.
          </Text>
          <Button
            onPress={() => router.push('/(customer)/discover')}
            style={styles.primaryActionBtn}
            title="Browse Neighborhood Kitchens"
            variant="primary"
          />
        </View>
      ) : null}

      {/* Case 2: Today's Meal (Level 1: NOW) */}
      {activeSub ? (
        <View style={styles.todaySection}>
          <Text style={styles.sectionOverline}>TODAY</Text>

          <Text style={styles.mealSlot}>{activeSub.mealType || 'Lunch'}</Text>
          <Text style={styles.dishTitle}>
            {todayMeal?.status === 'SKIPPED'
              ? 'Meal Skipped'
              : ((todayMeal as any)?.menuItemName || 'Classic Dal Bhat Tarkari')}
          </Text>

          <View style={styles.metaRow}>
            <Text style={styles.kitchenMeta}>Sita's Home Kitchen</Text>
            <Text style={styles.metaDot}>·</Text>
            <Text style={styles.timeMeta}>12:30–1:15 PM</Text>
          </View>

          <Text style={styles.statusLine}>
            {todayMeal?.status === 'SKIPPED'
              ? 'Skipped for today. Resumes tomorrow.'
              : 'Kitchen is preparing your lunch.'}
          </Text>

          <Text style={styles.cutoffNote}>
            Changes close at 10:30 AM
          </Text>

          <View style={styles.actionsRow}>
            <Button
              onPress={() => router.push('/(customer)/calendar')}
              size="md"
              style={styles.primaryActionBtn}
              title="Change meal"
              variant="neutral"
            />
          </View>

          {/* Thin Divider to Level 2 (SOON) */}
          <View style={styles.sectionDivider} />

          {/* Upcoming Section (Level 2: SOON) */}
          <View style={styles.upcomingHeader}>
            <Text style={styles.sectionOverline}>UPCOMING</Text>
            <TouchableOpacity
              onPress={() => router.push('/(customer)/calendar')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.fullCalendarLink}>Full schedule</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.upcomingList}>
            {(upcomingMeals.length > 0
              ? upcomingMeals
              : [
                  { id: '1', day: 'Tomorrow', meal: 'Chicken Thali' },
                  { id: '2', day: 'Friday', meal: 'Classic Dal Bhat Tarkari' },
                  { id: '3', day: 'Saturday', meal: 'Mixed Veg Tarkari & Roti' },
                ]
            ).map((item: any, idx, arr) => (
              <TouchableOpacity
                key={item.id || idx}
                style={[
                  styles.upcomingRow,
                  idx < arr.length - 1 && styles.upcomingRowBorder,
                ]}
                onPress={() => router.push('/(customer)/calendar')}
                activeOpacity={0.6}
              >
                <Text style={styles.upcomingDay}>{item.day || item.scheduledDate || 'Scheduled'}</Text>
                <Text style={styles.upcomingMeal} numberOfLines={1}>
                  {item.meal || item.menuItemName || 'Dal Bhat Tarkari'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : null}
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
  dateLabel: {
    ...Typography.sectionHeader,
    fontSize: 11,
    marginBottom: 4,
  },
  userName: {
    ...Typography.title,
    fontSize: 24,
  },
  emptyContainer: {
    paddingVertical: Spacing.xxl,
    alignItems: 'flex-start',
  },
  emptyTitle: {
    ...Typography.title,
    fontSize: 18,
    marginBottom: Spacing.xs,
  },
  emptyDesc: {
    ...Typography.body,
    marginBottom: Spacing.lg,
  },
  todaySection: {
    paddingTop: Spacing.xs,
  },
  sectionOverline: {
    ...Typography.sectionHeader,
    fontSize: 11,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  mealSlot: {
    ...Typography.subtitle,
    fontSize: 15,
    color: Colors.primary,
    marginBottom: 2,
  },
  dishTitle: {
    ...Typography.title,
    fontSize: 24,
    marginBottom: Spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  kitchenMeta: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontSize: 14,
  },
  metaDot: {
    marginHorizontal: 6,
    color: Colors.textMuted,
  },
  timeMeta: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontSize: 14,
  },
  statusLine: {
    ...Typography.body,
    fontSize: 14,
    color: Colors.secondaryDark,
    marginBottom: 4,
  },
  cutoffNote: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginBottom: Spacing.lg,
  },
  actionsRow: {
    flexDirection: 'row',
    marginBottom: Spacing.xl,
  },
  primaryActionBtn: {
    width: '100%',
  },
  sectionDivider: {
    height: 1,
    backgroundColor: Colors.surfaceBorder,
    marginBottom: Spacing.lg,
  },
  upcomingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  fullCalendarLink: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.primary,
  },
  upcomingList: {
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
  },
  upcomingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  upcomingRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  upcomingDay: {
    ...Typography.bodyBold,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  upcomingMeal: {
    ...Typography.body,
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'right',
  },
});
