import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subscriptionsApi } from '../../src/api/subscriptions';
import { mealsApi } from '../../src/api/meals';
import { providersApi } from '../../src/api/providers';
import { Button } from '../../src/components/ui/Button';
import type { MenuItem } from '@gharkhana/types';
import { Colors, Spacing, BorderRadius, Typography } from '../../src/theme/tokens';
import { X } from 'lucide-react-native';

interface DisplayCalendarDay {
  id: string;
  dateStr: string;
  dayName: string;
  dayNumber: number;
  mealName: string;
  unitPrice: string;
  statusText: string;
  isPastCutoff: boolean;
}

const FALLBACK_CALENDAR_DAYS: DisplayCalendarDay[] = [
  {
    id: 'm_1',
    dateStr: '2026-09-23',
    dayName: 'Today',
    dayNumber: 23,
    mealName: 'Classic Dal Bhat Tarkari',
    unitPrice: '220.00',
    statusText: 'Preparing',
    isPastCutoff: true,
  },
  {
    id: 'm_2',
    dateStr: '2026-09-24',
    dayName: 'Tomorrow',
    dayNumber: 24,
    mealName: 'Special Chicken Thali',
    unitPrice: '350.00',
    statusText: 'Customized',
    isPastCutoff: false,
  },
  {
    id: 'm_3',
    dateStr: '2026-09-25',
    dayName: 'Friday',
    dayNumber: 25,
    mealName: 'Meal Skipped',
    unitPrice: '0.00',
    statusText: 'Skipped',
    isPastCutoff: false,
  },
  {
    id: 'm_4',
    dateStr: '2026-09-26',
    dayName: 'Saturday',
    dayNumber: 26,
    mealName: 'Classic Dal Bhat Tarkari',
    unitPrice: '220.00',
    statusText: 'Scheduled',
    isPastCutoff: false,
  },
  {
    id: 'm_5',
    dateStr: '2026-09-27',
    dayName: 'Sunday',
    dayNumber: 27,
    mealName: 'Mixed Veg Tarkari & Roti',
    unitPrice: '190.00',
    statusText: 'Scheduled',
    isPastCutoff: false,
  },
];

export default function CalendarScreen() {
  const queryClient = useQueryClient();

  // 1. Fetch active subscription
  const { data: subscriptions } = useQuery({
    queryKey: ['my-subscriptions'],
    queryFn: async () => {
      try {
        return await subscriptionsApi.list();
      } catch {
        return null;
      }
    },
  });

  const activeSub = subscriptions?.find((s) => s.status === 'ACTIVE') || subscriptions?.[0];

  // 2. Fetch meal occurrences
  const { data: serverMeals } = useQuery({
    queryKey: ['subscription-meals', activeSub?.id],
    enabled: !!activeSub?.id,
    queryFn: async () => {
      try {
        return await subscriptionsApi.getMeals(activeSub!.id);
      } catch {
        return null;
      }
    },
  });

  // 3. Fetch dishes for modal
  const { data: menuItems } = useQuery({
    queryKey: ['customization-dishes', activeSub?.providerId],
    queryFn: async () => {
      try {
        if (!activeSub?.providerId) return getFallbackDishes();
        const menus = await providersApi.getMenus(activeSub.providerId);
        if (menus && menus[0]) {
          const items = await providersApi.getMenuItems(menus[0].id);
          return items && items.length > 0 ? items : getFallbackDishes();
        }
        return getFallbackDishes();
      } catch {
        return getFallbackDishes();
      }
    },
  });

  function getFallbackDishes(): MenuItem[] {
    return [
      {
        id: 'dish_1',
        menuId: 'm1',
        name: 'Classic Dal Bhat Tarkari',
        description: 'Steamed basmati, yellow lentils, saag, and tomato achar.',
        price: '220.00',
        mealType: 'LUNCH',
        availability: true,
        dietaryTags: ['Vegetarian'],
        imageUrl: null,
        createdAt: '',
        updatedAt: '',
      },
      {
        id: 'dish_2',
        menuId: 'm1',
        name: 'Special Chicken Thali',
        description: 'Home-style chicken curry, aromatic rice, and black dal.',
        price: '350.00',
        mealType: 'LUNCH',
        availability: true,
        dietaryTags: ['Non-Veg'],
        imageUrl: null,
        createdAt: '',
        updatedAt: '',
      },
      {
        id: 'dish_3',
        menuId: 'm1',
        name: 'Mixed Veg Tarkari & Roti',
        description: 'Three hand-rolled rotis with seasonal sabzi and curd.',
        price: '190.00',
        mealType: 'LUNCH',
        availability: true,
        dietaryTags: ['Vegetarian'],
        imageUrl: null,
        createdAt: '',
        updatedAt: '',
      },
    ];
  }

  const calendarDays: DisplayCalendarDay[] = (
    serverMeals && serverMeals.length > 0
      ? serverMeals.map((m: any, idx: number) => {
          const d = new Date(m.scheduledDate || Date.now() + idx * 86400000);
          const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          const isSkipped = m.status === 'SKIPPED';
          const isCustomized = m.customizationSource === 'CUSTOMER_OVERRIDE';
          return {
            id: m.id,
            dateStr: m.scheduledDate,
            dayName: idx === 0 ? 'Today' : idx === 1 ? 'Tomorrow' : dayNames[d.getDay()],
            dayNumber: d.getDate(),
            mealName: isSkipped ? 'Meal Skipped' : (m.menuItemName || 'Classic Dal Bhat Tarkari'),
            unitPrice: m.unitPrice || '220.00',
            statusText: isSkipped ? 'Skipped' : isCustomized ? 'Customized' : 'Scheduled',
            isPastCutoff: m.isPastCutoff || false,
          } as DisplayCalendarDay;
        })
      : FALLBACK_CALENDAR_DAYS
  );

  const [selectedDay, setSelectedDay] = useState<DisplayCalendarDay | null>(null);
  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);

  // Skip & Restore mutations
  const skipMutation = useMutation({
    mutationFn: (id: string) => mealsApi.skip(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-meals'] });
      setSelectedDay(null);
      Alert.alert('Meal skipped', 'Delivery has been skipped for this date.');
    },
    onError: (err: any) => {
      Alert.alert('Cutoff passed', err.message || 'Cannot skip after daily cutoff time (10:30 AM).');
    },
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => mealsApi.restore(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-meals'] });
      setSelectedDay(null);
      Alert.alert('Meal restored', 'Scheduled meal delivery has been restored.');
    },
    onError: (err: any) => {
      Alert.alert('Notice', err.message || 'Cannot restore after cutoff time.');
    },
  });

  const customizeMutation = useMutation({
    mutationFn: ({ mealId, dishId }: { mealId: string; dishId: string }) =>
      mealsApi.customize(mealId, dishId, 1),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-meals'] });
      setIsCustomizeModalOpen(false);
      setSelectedDay(null);
      Alert.alert('Dish updated', 'Your selection has been saved.');
    },
    onError: (err: any) => {
      Alert.alert('Notice', err.message || 'Customization locked after cutoff.');
    },
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>My Meals</Text>
        <Text style={styles.subtitle}>
          Tap any upcoming day to change dish or skip delivery.
        </Text>
      </View>

      {/* Schedule List */}
      <View style={styles.list}>
        {calendarDays.map((day, idx, arr) => (
          <TouchableOpacity
            key={day.id}
            onPress={() => setSelectedDay(day)}
            style={[
              styles.dayRow,
              idx < arr.length - 1 && styles.dayRowBorder,
            ]}
            activeOpacity={0.6}
          >
            <View style={styles.dateCol}>
              <Text style={styles.dayName}>{day.dayName}</Text>
              <Text style={styles.dateStr}>{day.dateStr}</Text>
            </View>

            <View style={styles.mealCol}>
              <Text style={styles.mealName} numberOfLines={1}>{day.mealName}</Text>
              <Text style={styles.statusText}>{day.statusText}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Selected Day Action Sheet */}
      <Modal
        animationType="fade"
        transparent
        visible={!!selectedDay}
        onRequestClose={() => setSelectedDay(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.actionSheetContent}>
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetDayTitle}>{selectedDay?.dayName}</Text>
                <Text style={styles.sheetDate}>{selectedDay?.dateStr}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedDay(null)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X color={Colors.textPrimary} size={20} />
              </TouchableOpacity>
            </View>

            <Text style={styles.sheetMealTitle}>{selectedDay?.mealName}</Text>

            {selectedDay?.isPastCutoff ? (
              <Text style={styles.sheetCutoffText}>
                Changes closed for this day at 10:30 AM cutoff.
              </Text>
            ) : (
              <Text style={styles.sheetOpenText}>
                Modifications open until 10:30 AM on delivery day.
              </Text>
            )}

            {!selectedDay?.isPastCutoff && (
              <View style={styles.sheetActionsRow}>
                {selectedDay?.statusText === 'Skipped' ? (
                  <Button
                    loading={restoreMutation.isPending}
                    onPress={() => selectedDay && restoreMutation.mutate(selectedDay.id)}
                    style={{ width: '100%' }}
                    title="Restore scheduled meal"
                    variant="primary"
                  />
                ) : (
                  <>
                    <Button
                      onPress={() => setIsCustomizeModalOpen(true)}
                      style={{ flex: 1 }}
                      title="Change dish"
                      variant="primary"
                    />
                    <Button
                      loading={skipMutation.isPending}
                      onPress={() => selectedDay && skipMutation.mutate(selectedDay.id)}
                      style={{ flex: 1 }}
                      title="Skip this day"
                      variant="outline"
                    />
                  </>
                )}
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Choose Dish Sheet */}
      <Modal
        animationType="fade"
        transparent
        visible={isCustomizeModalOpen}
        onRequestClose={() => setIsCustomizeModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.actionSheetContent}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetDayTitle}>Choose dish</Text>
              <TouchableOpacity
                onPress={() => setIsCustomizeModalOpen(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X color={Colors.textPrimary} size={20} />
              </TouchableOpacity>
            </View>

            <View style={styles.dishesList}>
              {(menuItems || []).map((dish) => (
                <TouchableOpacity
                  key={dish.id}
                  onPress={() =>
                    selectedDay &&
                    customizeMutation.mutate({
                      mealId: selectedDay.id,
                      dishId: dish.id,
                    })
                  }
                  style={styles.dishOptionRow}
                  activeOpacity={0.7}
                >
                  <View style={{ flex: 1, marginRight: Spacing.sm }}>
                    <Text style={styles.dishOptionName}>{dish.name}</Text>
                    <Text style={styles.dishOptionDesc} numberOfLines={1}>{dish.description}</Text>
                  </View>
                  <Text style={styles.selectText}>Select</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
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
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.title,
    fontSize: 24,
    marginBottom: 4,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontSize: 14,
  },
  list: {
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
  },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  dayRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  dateCol: {
    width: 100,
  },
  dayName: {
    ...Typography.bodyBold,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  dateStr: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 1,
  },
  mealCol: {
    flex: 1,
    alignItems: 'flex-end',
  },
  mealName: {
    ...Typography.bodyBold,
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  statusText: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.textMuted,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  actionSheetContent: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    padding: Spacing.lg,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  sheetDayTitle: {
    ...Typography.subtitle,
    fontSize: 17,
  },
  sheetDate: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: 12,
  },
  sheetMealTitle: {
    ...Typography.title,
    fontSize: 20,
    marginBottom: Spacing.xs,
  },
  sheetCutoffText: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginBottom: Spacing.lg,
  },
  sheetOpenText: {
    ...Typography.caption,
    color: Colors.secondaryDark,
    marginBottom: Spacing.lg,
  },
  sheetActionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  dishesList: {
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  dishOptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  dishOptionName: {
    ...Typography.bodyBold,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  dishOptionDesc: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 12,
  },
  selectText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
});
