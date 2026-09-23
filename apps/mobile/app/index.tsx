import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/stores/authStore';
import { Colors, Spacing, Typography } from '../src/theme/tokens';

export default function Index() {
  const { isAuthenticated, user, isLoading } = useAuthStore();

  if (!isLoading) {
    if (!isAuthenticated || !user) {
      return <Redirect href="/(auth)/login" />;
    }

    return <Redirect href={user.role === 'PROVIDER' ? '/(provider)/dashboard' : '/(customer)/home'} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.brandTitle}>घरखाना</Text>
      <Text style={styles.brandSubtitle}>GharKhana</Text>
      <Text style={styles.tagline}>
        Daily recurring household meal subscriptions
      </Text>
      <ActivityIndicator
        color={Colors.primary}
        size="small"
        style={styles.spinner}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  brandTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    ...Typography.subtitle,
    fontSize: 18,
    marginTop: Spacing.xs,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  tagline: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  spinner: {
    marginTop: Spacing.xl,
  },
});
