import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/stores/authStore';
import { Colors } from '../../src/theme/tokens';
import { AlertCircle, Eye, EyeOff, UtensilsCrossed, ChefHat } from 'lucide-react-native';
import type { UserRole, ProviderType } from '@gharkhana/types';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const signupDecoration = require('../../assets/splash/signup_decoration.png');

export default function RegisterScreen() {
  const router = useRouter();
  const { register, isLoading, error, clearError } = useAuthStore();

  // Role: CUSTOMER = Service Taker, PROVIDER = Cook
  const [role, setRole] = useState<UserRole>('CUSTOMER');

  // Shared fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Cook / Kitchen specific fields
  const [displayName, setDisplayName] = useState('');
  const [providerType, setProviderType] = useState<ProviderType>('HOME_COOK');

  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [localError, setLocalError] = useState('');

  const handleRegister = async () => {
    if (!name.trim()) {
      setLocalError(
        role === 'PROVIDER'
          ? 'Please enter your full name'
          : 'Please enter your name'
      );
      return;
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setLocalError('Please enter your email or phone number');
      return;
    }

    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);
    const isPhone = /^\+?[0-9]{10,15}$/.test(trimmedEmail);

    if (!isEmail && !isPhone) {
      setLocalError('Please enter a valid email address');
      return;
    }

    if (role === 'PROVIDER' && !displayName.trim()) {
      setLocalError('Please enter your kitchen name');
      return;
    }

    if (password.length < 8) {
      setLocalError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    setLocalError('');
    clearError();

    try {
      await register({
        name: name.trim(),
        email: isEmail ? trimmedEmail.toLowerCase() : undefined,
        phone: isPhone ? trimmedEmail : undefined,
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
      // Handled by store
    }
  };

  return (
    <View style={styles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex1}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Top Artistic Area (Corner botanical leaf + circular accents) ── */}
          <View style={styles.topArtArea}>
            <View style={styles.circleTopLeft} />

            <Image
              source={signupDecoration}
              style={styles.cornerDecoration}
              resizeMode="contain"
            />

            <View style={styles.circleMidRight} />
          </View>

          {/* ── Main Form Container ── */}
          <View style={styles.formContainer}>
            {/* Dynamic Header */}
            <Text style={styles.title}>
              {role === 'CUSTOMER' ? 'Sign up' : 'Join as Cook'}
            </Text>
            <Text style={styles.subtitle}>
              {role === 'CUSTOMER'
                ? 'Create an account, It’s free'
                : 'Share your home cooking & earn'}
            </Text>

            {/* ── Role Selector Pill: Service Taker vs Cook ── */}
            <View style={styles.roleContainer}>
              <TouchableOpacity
                style={[
                  styles.roleTab,
                  role === 'CUSTOMER' && styles.roleTabActive,
                ]}
                onPress={() => {
                  setRole('CUSTOMER');
                  setLocalError('');
                }}
                activeOpacity={0.8}
              >
                <UtensilsCrossed
                  size={14}
                  color={role === 'CUSTOMER' ? '#FFFFFF' : '#64748B'}
                />
                <Text
                  style={[
                    styles.roleTabText,
                    role === 'CUSTOMER' && styles.roleTabTextActive,
                  ]}
                >
                  Service Taker
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.roleTab,
                  role === 'PROVIDER' && styles.roleTabActive,
                ]}
                onPress={() => {
                  setRole('PROVIDER');
                  setLocalError('');
                }}
                activeOpacity={0.8}
              >
                <ChefHat
                  size={15}
                  color={role === 'PROVIDER' ? '#FFFFFF' : '#64748B'}
                />
                <Text
                  style={[
                    styles.roleTabText,
                    role === 'PROVIDER' && styles.roleTabTextActive,
                  ]}
                >
                  Cook / Kitchen
                </Text>
              </TouchableOpacity>
            </View>

            {/* Error Message */}
            {(error || localError) ? (
              <View style={styles.errorBox}>
                <AlertCircle color={Colors.danger} size={15} />
                <Text style={styles.errorText}>{localError || error}</Text>
              </View>
            ) : null}

            {/* ── Minimal Underline Input Fields ── */}
            {/* Full Name */}
            <View style={styles.fieldGroup}>
              <Text
                style={[
                  styles.floatingLabel,
                  (focusedField === 'name' || name.length > 0) &&
                    styles.floatingLabelVisible,
                  focusedField === 'name' && styles.floatingLabelFocused,
                ]}
              >
                {role === 'PROVIDER' ? 'Cook’s Full Name' : 'Full Name'}
              </Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.textInput}
                  placeholder={
                    focusedField === 'name' || name.length > 0
                      ? ''
                      : role === 'PROVIDER'
                      ? 'Your Full Name'
                      : 'Full Name'
                  }
                  placeholderTextColor="#9CA3AF"
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    setLocalError('');
                  }}
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
              <View
                style={[
                  styles.underline,
                  focusedField === 'name' && styles.underlineFocused,
                ]}
              />
            </View>

            {/* Kitchen Name (Provider only) */}
            {role === 'PROVIDER' && (
              <View style={styles.fieldGroup}>
                <Text
                  style={[
                    styles.floatingLabel,
                    (focusedField === 'displayName' || displayName.length > 0) &&
                      styles.floatingLabelVisible,
                    focusedField === 'displayName' && styles.floatingLabelFocused,
                  ]}
                >
                  Kitchen Display Name
                </Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.textInput}
                    placeholder={
                      focusedField === 'displayName' || displayName.length > 0
                        ? ''
                        : 'e.g. Sita’s Home Kitchen'
                    }
                    placeholderTextColor="#9CA3AF"
                    value={displayName}
                    onChangeText={(text) => {
                      setDisplayName(text);
                      setLocalError('');
                    }}
                    onFocus={() => setFocusedField('displayName')}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
                <View
                  style={[
                    styles.underline,
                    focusedField === 'displayName' && styles.underlineFocused,
                  ]}
                />
              </View>
            )}

            {/* Email / Phone */}
            <View style={styles.fieldGroup}>
              <Text
                style={[
                  styles.floatingLabel,
                  (focusedField === 'email' || email.length > 0) &&
                    styles.floatingLabelVisible,
                  focusedField === 'email' && styles.floatingLabelFocused,
                ]}
              >
                Email
              </Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.textInput}
                  placeholder={
                    focusedField === 'email' || email.length > 0 ? '' : 'Email'
                  }
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    setLocalError('');
                  }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
              <View
                style={[
                  styles.underline,
                  focusedField === 'email' && styles.underlineFocused,
                ]}
              />
            </View>

            {/* Kitchen Type Chips (Provider only) */}
            {role === 'PROVIDER' && (
              <View style={styles.providerTypeContainer}>
                <Text style={styles.kitchenTypeLabel}>KITCHEN TYPE</Text>
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
            )}

            {/* Password Field */}
            <View style={styles.fieldGroup}>
              <Text
                style={[
                  styles.floatingLabel,
                  (focusedField === 'password' || password.length > 0) &&
                    styles.floatingLabelVisible,
                  focusedField === 'password' && styles.floatingLabelFocused,
                ]}
              >
                Password
              </Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.textInput}
                  placeholder={
                    focusedField === 'password' || password.length > 0
                      ? ''
                      : 'Password'
                  }
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    setLocalError('');
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                  activeOpacity={0.7}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  {showPassword ? (
                    <EyeOff size={18} color="#9CA3AF" />
                  ) : (
                    <Eye size={18} color="#9CA3AF" />
                  )}
                </TouchableOpacity>
              </View>
              <View
                style={[
                  styles.underline,
                  focusedField === 'password' && styles.underlineFocused,
                ]}
              />
            </View>

            {/* Confirm Password Field */}
            <View style={styles.fieldGroup}>
              <Text
                style={[
                  styles.floatingLabel,
                  (focusedField === 'confirmPassword' ||
                    confirmPassword.length > 0) &&
                    styles.floatingLabelVisible,
                  focusedField === 'confirmPassword' &&
                    styles.floatingLabelFocused,
                ]}
              >
                Confirm Password
              </Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.textInput}
                  placeholder={
                    focusedField === 'confirmPassword' ||
                    confirmPassword.length > 0
                      ? ''
                      : 'Confirm Password'
                  }
                  placeholderTextColor="#9CA3AF"
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    setLocalError('');
                  }}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  onFocus={() => setFocusedField('confirmPassword')}
                  onBlur={() => setFocusedField(null)}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeButton}
                  activeOpacity={0.7}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} color="#9CA3AF" />
                  ) : (
                    <Eye size={18} color="#9CA3AF" />
                  )}
                </TouchableOpacity>
              </View>
              <View
                style={[
                  styles.underline,
                  focusedField === 'confirmPassword' && styles.underlineFocused,
                ]}
              />
            </View>

            {/* ── Sign Up CTA ── */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                isLoading && styles.submitButtonDisabled,
              ]}
              onPress={handleRegister}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {role === 'CUSTOMER' ? 'Sign Up' : 'Register as Cook'}
                </Text>
              )}
            </TouchableOpacity>

            {/* ── Footer ── */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                <Text style={styles.footerLink}>Log In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  flex1: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },

  // ── Top Artistic Area ──
  topArtArea: {
    height: 145,
    position: 'relative',
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
  },
  cornerDecoration: {
    position: 'absolute',
    top: 4,
    right: 0,
    width: 190,
    height: 140,
  },
  circleTopLeft: {
    position: 'absolute',
    top: 24,
    left: 24,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.8,
    borderColor: '#FED7AA',
    backgroundColor: '#FFF7ED',
  },
  circleMidRight: {
    position: 'absolute',
    top: 90,
    right: 18,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.8,
    borderColor: '#FED7AA',
    backgroundColor: '#FFF7ED',
  },

  // ── Main Form Container ──
  formContainer: {
    paddingHorizontal: 36,
    paddingTop: 4,
    paddingBottom: 40,
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
  },

  // Centered Typography
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A1A',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 20,
  },

  // ── Role Segmented Pill ──
  roleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 24,
    padding: 3,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  roleTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 20,
    gap: 6,
  },
  roleTabActive: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  roleTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  roleTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Error Alert
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    padding: 10,
    marginBottom: 18,
  },
  errorText: {
    fontSize: 12,
    color: Colors.danger,
    fontWeight: '500',
    flex: 1,
  },

  // ── Underline Input Fields ──
  fieldGroup: {
    marginBottom: 20,
  },
  floatingLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
    marginBottom: 2,
    opacity: 0,
    height: 14,
  },
  floatingLabelVisible: {
    opacity: 1,
  },
  floatingLabelFocused: {
    color: Colors.primary,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#1A1A1A',
    paddingVertical: 6,
    paddingHorizontal: 0,
  },
  eyeButton: {
    padding: 4,
  },
  underline: {
    height: 1.2,
    backgroundColor: '#E5E7EB',
    marginTop: 4,
  },
  underlineFocused: {
    height: 2,
    backgroundColor: Colors.primary,
  },

  // ── Provider Kitchen Type Chips ──
  providerTypeContainer: {
    marginBottom: 20,
    marginTop: 2,
  },
  kitchenTypeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1,
    marginBottom: 8,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  typeChip: {
    flex: 1,
    paddingVertical: 9,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    alignItems: 'center',
  },
  typeChipActive: {
    borderColor: Colors.primary,
    backgroundColor: '#FFF7ED',
  },
  typeChipText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  typeChipTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },

  // ── Sign Up CTA (Pill Button) ──
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: 26,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    marginBottom: 20,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // ── Footer ──
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  footerText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  footerLink: {
    fontSize: 13,
    color: '#1A1A1A',
    fontWeight: '700',
  },
});
