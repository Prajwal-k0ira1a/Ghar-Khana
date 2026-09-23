import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/stores/authStore';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { Colors, Spacing, BorderRadius, Typography } from '../../src/theme/tokens';
import { ArrowRight, AlertCircle } from 'lucide-react-native';

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuthStore();

  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');

  const handleLogin = async () => {
    if (!loginInput.trim()) {
      setLocalError('Please enter your email or phone number');
      return;
    }
    if (!password) {
      setLocalError('Please enter your password');
      return;
    }

    setLocalError('');
    clearError();

    try {
      await login({
        login: loginInput.trim(),
        password,
      });

      const user = useAuthStore.getState().user;
      if (user?.role === 'PROVIDER') {
        router.replace('/(provider)/dashboard');
      } else {
        router.replace('/(customer)/home');
      }
    } catch {
      // Handled by store
    }
  };

  const fillDemoCustomer = () => {
    setLoginInput('customer@gharkhana.app');
    setPassword('Password123!');
    setLocalError('');
    clearError();
  };

  const fillDemoProvider = () => {
    setLoginInput('provider@gharkhana.app');
    setPassword('Password123!');
    setLocalError('');
    clearError();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.brandTitle}>घरखाना</Text>
          <Text style={styles.title}>Sign In to GharKhana</Text>
          <Text style={styles.subtitle}>
            Access your recurring household meal subscriptions and daily schedule.
          </Text>
        </View>

        {(error || localError) ? (
          <View style={styles.errorBox}>
            <AlertCircle color={Colors.danger} size={15} />
            <Text style={styles.errorText}>{localError || error}</Text>
          </View>
        ) : null}

        <View style={styles.form}>
          <Input
            autoCapitalize="none"
            keyboardType="email-address"
            label="Email or Mobile Phone"
            onChangeText={(text) => {
              setLoginInput(text);
              setLocalError('');
            }}
            placeholder="e.g. customer@gharkhana.app or 9800000001"
            value={loginInput}
          />

          <Input
            label="Password"
            onChangeText={(text) => {
              setPassword(text);
              setLocalError('');
            }}
            placeholder="Enter your password"
            secureTextEntry
            value={password}
          />

          <Button
            loading={isLoading}
            onPress={handleLogin}
            size="lg"
            style={styles.loginButton}
            title="Sign In"
            rightIcon={<ArrowRight color="#FFFFFF" size={16} />}
          />

          <View style={styles.demoBox}>
            <Text style={styles.demoTitle}>QUICK DEMO ACCOUNTS</Text>
            <View style={styles.demoButtons}>
              <TouchableOpacity
                onPress={fillDemoCustomer}
                style={styles.demoChip}
                activeOpacity={0.7}
              >
                <Text style={styles.demoChipText}>Customer Demo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={fillDemoProvider}
                style={styles.demoChip}
                activeOpacity={0.7}
              >
                <Text style={styles.demoChipText}>Kitchen Provider Demo</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Need a new account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <Text style={styles.signupLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.primary,
    marginBottom: 4,
  },
  title: {
    ...Typography.title,
    fontSize: 24,
    marginBottom: 4,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: BorderRadius.xs,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
  },
  errorText: {
    ...Typography.caption,
    color: Colors.danger,
    fontWeight: '500',
  },
  form: {
    marginTop: Spacing.xs,
  },
  loginButton: {
    marginTop: Spacing.sm,
  },
  demoBox: {
    marginTop: Spacing.xl,
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  demoTitle: {
    ...Typography.sectionHeader,
    fontSize: 10,
    marginBottom: Spacing.xs + 2,
  },
  demoButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  demoChip: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: BorderRadius.xs,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  demoChipText: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  footerText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 13,
  },
  signupLink: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
});
