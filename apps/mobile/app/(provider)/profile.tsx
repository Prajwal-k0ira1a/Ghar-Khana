import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/stores/authStore';
import { Button } from '../../src/components/ui/Button';
import { Colors, Spacing, Typography } from '../../src/theme/tokens';

export default function ProviderProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Kitchen Settings</Text>
        <Text style={styles.subtitle}>Hira's Home Kitchen · {user?.name || 'Operator'}</Text>
      </View>

      {/* Capacity Limits */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>DAILY BATCH CAPACITY</Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Lunch capacity</Text>
          <Text style={styles.detailValue}>40 meals / day</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Dinner capacity</Text>
          <Text style={styles.detailValue}>30 meals / day</Text>
        </View>
      </View>

      {/* Rules & Settlement */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>OPERATING RULES</Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Cutoff time</Text>
          <Text style={styles.detailValue}>10:30 AM (Lunch)</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Delivery radius</Text>
          <Text style={styles.detailValue}>4.0 km</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Platform fee</Text>
          <Text style={styles.detailValue}>10% on settlement</Text>
        </View>
      </View>

      {/* Contact */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>CONTACT</Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Phone</Text>
          <Text style={styles.detailValue}>{user?.phone || '+977 9800000002'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Location</Text>
          <Text style={styles.detailValue}>Khichapokhari, New Road</Text>
        </View>
      </View>

      {/* Sign Out */}
      <View style={styles.actionWrap}>
        <Button
          onPress={handleLogout}
          size="md"
          title="Sign out of kitchen"
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
