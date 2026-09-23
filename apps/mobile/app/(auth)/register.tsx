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
import { AlertCircle, ArrowRight } from 'lucide-react-native';
import type { UserRole, ProviderType } from '@gharkhana/types';

export default function RegisterScreen() {
  const router = useRouter();
  const { register, isLoading, error, clearError } = useAuthStore();

  const [role, setRole] = useState<UserRole>('CUSTOMER');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [providerType, setProviderType] = useState<ProviderType>('HOME_COOK');
  const [localError, setLocalError] = useState('');

  const handleRegister = async () => {
    if (!name.trim()) {
      setLocalError('Please enter your full name');
      return;
    }
    if (!phone.trim() && !email.trim()) {
      setLocalError('Please provide either a phone number or email');
      return;
    }
    if (password.length < 8) {
      setLocalError('Password must be at least 8 characters');
      return;
    }
    if (role === 'PROVIDER' && !displayName.trim()) {
      setLocalError('Please provide a kitchen or cook display name');
      return;
    }

    setLocalError('');
    clearError();

    try {
      await register({
        name: name.trim(),
        phone: phone.trim() ? phone.trim() : undefined,
        email: email.trim() ? email.trim().toLowerCase() : undefined,
        password,
        role: role as 'CUSTOMER' | 'PROVIDER',
        displayName: role === 'PROVIDER' ? displayName.trim() : undefined,
        providerType: role === 'PROVIDER' ? providerType : undefined,
      });

      const user = useAuthStore.getState().user;
      if (user?.role === 'PROVIDER') {
        router.replace('/(provider)/dashboard');
      } else {
        router.replace('/(customer)/home');
      }
    } catch {
      // Error handled by store
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.brandTitle}>घरखाना</Text>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>
            Subscribe to wholesome household meals or offer daily batches from your kitchen.
          </Text>
        </View>

        {/* Role Selector Tabs */}
        <View style={styles.roleSelector}>
          <TouchableOpacity
            onPress={() => setRole('CUSTOMER')}
            style={[styles.roleTab, role === 'CUSTOMER' && styles.roleTabActive]}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.roleTabText,
                role === 'CUSTOMER' && styles.roleTabTextActive,
              ]}
            >
              Meal Subscriber
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setRole('PROVIDER')}
            style={[styles.roleTab, role === 'PROVIDER' && styles.roleTabActive]}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.roleTabText,
                role === 'PROVIDER' && styles.roleTabTextActive,
              ]}
            >
              Home Kitchen
            </Text>
          </TouchableOpacity>
        </View>

        {(error || localError) ? (
          <View style={styles.errorBox}>
            <AlertCircle color={Colors.danger} size={15} />
            <Text style={styles.errorText}>{localError || error}</Text>
          </View>
        ) : null}

        <View style={styles.form}>
          <Input
            label="Full Legal Name"
            onChangeText={(text) => {
              setName(text);
              setLocalError('');
            }}
            placeholder="e.g. Ramesh Shrestha"
            value={name}
          />

          <Input
            keyboardType="phone-pad"
            label="Mobile Phone Number"
            onChangeText={(text) => {
              setPhone(text);
              setLocalError('');
            }}
            placeholder="+977 98XXXXXXXX"
            value={phone}
          />

          <Input
            autoCapitalize="none"
            keyboardType="email-address"
            label="Email Address"
            onChangeText={(text) => {
              setEmail(text);
              setLocalError('');
            }}
            placeholder="you@example.com"
            value={email}
          />

          {role === 'PROVIDER' && (
            <>
              <Input
                label="Kitchen / Cook Display Name"
                onChangeText={(text) => {
                  setDisplayName(text);
                  setLocalError('');
                }}
                placeholder="e.g. Hira's Home Kitchen"
                value={displayName}
              />

              <View style={styles.providerTypeContainer}>
                <Text style={styles.inputLabel}>KITCHEN CLASSIFICATION</Text>
                <View style={styles.typeButtons}>
                  {(
                    [
                      ['HOME_COOK', 'Home Cook'],
                      ['HOUSEHOLD', 'Household'],
                      ['SMALL_HOME_KITCHEN', 'Small Kitchen'],
                    ] as const
                  ).map(([typeVal, label]) => {
                    const isSelected = providerType === typeVal;
                    return (
                      <TouchableOpacity
                        key={typeVal}
                        onPress={() => setProviderType(typeVal)}
                        style={[
                          styles.typeChip,
                          isSelected && styles.typeChipActive,
                        ]}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.typeChipText,
                            isSelected && styles.typeChipTextActive,
                          ]}
                        >
                          {label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </>
          )}

          <Input
            label="Account Password (min. 8 characters)"
            onChangeText={(text) => {
              setPassword(text);
              setLocalError('');
            }}
            placeholder="Choose a secure password"
            secureTextEntry
            value={password}
          />

          <Button
            loading={isLoading}
            onPress={handleRegister}
            size="lg"
            style={styles.submitButton}
            title={role === 'PROVIDER' ? 'Register Kitchen Account' : 'Create Customer Account'}
            rightIcon={<ArrowRight color="#FFFFFF" size={16} />}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.loginLink}>Sign In</Text>
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
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  header: {
    marginBottom: Spacing.md,
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
  roleSelector: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xs,
    padding: 3,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  roleTab: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: BorderRadius.xs,
  },
  roleTabActive: {
    backgroundColor: Colors.textPrimary,
  },
  roleTabText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  roleTabTextActive: {
    color: '#FFFFFF',
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
  providerTypeContainer: {
    marginBottom: Spacing.sm,
  },
  inputLabel: {
    ...Typography.sectionHeader,
    fontSize: 10,
    marginBottom: 4,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  typeChip: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderRadius: BorderRadius.xs,
    alignItems: 'center',
  },
  typeChipActive: {
    borderColor: Colors.textPrimary,
    backgroundColor: Colors.surfaceSubtle,
  },
  typeChipText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 11,
  },
  typeChipTextActive: {
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  submitButton: {
    marginTop: Spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  footerText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 13,
  },
  loginLink: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
});
