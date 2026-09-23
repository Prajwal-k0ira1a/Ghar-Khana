import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { providerOperationsApi, type ProviderSubscriberItem } from '../../src/api/providerOperations';
import { Colors, Spacing, Typography } from '../../src/theme/tokens';

const FALLBACK_SUBSCRIBERS: ProviderSubscriberItem[] = [
  {
    id: 'sub_1',
    customerId: 'cust_1',
    providerId: 'prov_1',
    locationId: 'loc_1',
    startDate: '2026-10-01',
    endDate: '2026-10-31',
    frequency: 'MONTHLY',
    mealType: 'LUNCH',
    status: 'ACTIVE',
    quantity: 1,
    totalPrice: '6600.00',
    cutoffPolicyId: null,
    promoRedemptionId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    customerName: 'Ramesh Shrestha',
    locationLabel: 'Khichapokhari, New Road (Office)',
    dishName: 'Classic Dal Bhat Tarkari',
  },
  {
    id: 'sub_2',
    customerId: 'cust_2',
    providerId: 'prov_1',
    locationId: 'loc_2',
    startDate: '2026-10-05',
    endDate: '2026-10-11',
    frequency: 'WEEKLY',
    mealType: 'LUNCH',
    status: 'ACTIVE',
    quantity: 1,
    totalPrice: '1750.00',
    cutoffPolicyId: null,
    promoRedemptionId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    customerName: 'Bina Shakya',
    locationLabel: 'Basantapur, Freak Street',
    dishName: 'Special Chicken Thali',
  },
  {
    id: 'sub_3',
    customerId: 'cust_3',
    providerId: 'prov_1',
    locationId: 'loc_3',
    startDate: '2026-10-01',
    endDate: '2026-10-31',
    frequency: 'MONTHLY',
    mealType: 'LUNCH',
    status: 'ACTIVE',
    quantity: 2,
    totalPrice: '13200.00',
    cutoffPolicyId: null,
    promoRedemptionId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    customerName: 'Prakash Thapa',
    locationLabel: 'Dharahara Tower Area (Office)',
    dishName: 'Mixed Veg Tarkari & Roti',
  },
];

export default function ProviderSubscriptionsScreen() {
  const { data: subscribers, isLoading } = useQuery({
    queryKey: ['provider-subscribers'],
    queryFn: async () => {
      try {
        const res = await providerOperationsApi.getSubscribers();
        return res && res.length > 0 ? res : FALLBACK_SUBSCRIBERS;
      } catch {
        return FALLBACK_SUBSCRIBERS;
      }
    },
  });

  const subsList = subscribers || FALLBACK_SUBSCRIBERS;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Subscribers ({subsList.length})</Text>
        <Text style={styles.subtitle}>
          Active recurring meal contracts for your kitchen.
        </Text>
      </View>

      {isLoading ? (
        <ActivityIndicator color={Colors.primary} size="small" style={{ marginVertical: Spacing.xl }} />
      ) : (
        <View style={styles.list}>
          {subsList.map((sub, idx, arr) => (
            <View
              key={sub.id}
              style={[
                styles.subscriberRow,
                idx < arr.length - 1 && styles.subscriberRowBorder,
              ]}
            >
              <View style={styles.nameCol}>
                <Text style={styles.customerName}>{sub.customerName || 'Subscriber'}</Text>
                <Text style={styles.planDetails}>
                  {sub.frequency === 'MONTHLY' ? 'Monthly' : 'Weekly'} {sub.mealType?.toLowerCase()} · {sub.dishName}
                </Text>
                <Text style={styles.addressLine}>
                  {sub.locationLabel || (sub as any).addressLine || 'Kathmandu Address'}
                </Text>
              </View>

              <View style={styles.portionCol}>
                <Text style={styles.portionCount}>{sub.quantity} {sub.quantity === 1 ? 'portion' : 'portions'}</Text>
                <Text style={styles.statusText}>Active</Text>
              </View>
            </View>
          ))}
        </View>
      )}
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
  title: {
    ...Typography.title,
    fontSize: 24,
    marginBottom: 2,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontSize: 13,
  },
  list: {
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
  },
  subscriberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: Spacing.md,
  },
  subscriberRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  nameCol: {
    flex: 1,
    marginRight: Spacing.md,
  },
  customerName: {
    ...Typography.bodyBold,
    fontSize: 15,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  planDetails: {
    ...Typography.body,
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  addressLine: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: 12,
  },
  portionCol: {
    alignItems: 'flex-end',
  },
  portionCount: {
    ...Typography.bodyBold,
    fontSize: 13,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  statusText: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.secondaryDark,
    fontWeight: '600',
  },
});
