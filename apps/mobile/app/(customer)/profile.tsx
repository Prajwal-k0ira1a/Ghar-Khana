import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/stores/authStore';
import { Button } from '../../src/components/ui/Button';
import { Colors, Spacing, Typography } from '../../src/theme/tokens';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Account</Text>
        <Text style={styles.subtitle}>{user?.name || 'Customer'}</Text>
      </View>

      {/* Contact Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>CONTACT</Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Phone</Text>
          <Text style={styles.detailValue}>{user?.phone || '+977 9800000001'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Email</Text>
          <Text style={styles.detailValue}>{user?.email || 'customer@gharkhana.app'}</Text>
        </View>
      </View>

      {/* Primary Delivery Location */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>PRIMARY DELIVERY ADDRESS</Text>
        <Text style={styles.addressLabel}>Office / Workplace</Text>
        <Text style={styles.addressText}>House 45, Khichapokhari, New Road, Kathmandu</Text>
        <Text style={styles.instructionsText}>Landmark: 3rd Floor, IT Operations</Text>
      </View>

      {/* Policies */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>CUTOFF POLICY</Text>
        <Text style={styles.policyText}>
          Daily lunch changes close at 10:30 AM. Dinner changes close at 4:30 PM.
        </Text>
      </View>

      {/* Sign Out */}
      <View style={styles.actionWrap}>
        <Button
          onPress={handleLogout}
          size="md"
          title="Sign out"
          variant="outline"
          style={styles.logoutBtn}
        />
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
  title: {
    ...Typography.title,
    fontSize: 24,
    marginBottom: 2,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontSize: 14,
  },
  section: {
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
    paddingVertical: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.sectionHeader,
    fontSize: 11,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  detailLabel: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontSize: 14,
  },
  detailValue: {
    ...Typography.bodyBold,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  addressLabel: {
    ...Typography.bodyBold,
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  addressText: {
    ...Typography.body,
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  instructionsText: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  policyText: {
    ...Typography.body,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  actionWrap: {
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
    paddingTop: Spacing.xl,
  },
  logoutBtn: {
    width: '100%',
    borderColor: '#FECACA',
  },
});
