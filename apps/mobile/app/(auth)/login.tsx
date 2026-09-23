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
import { AlertCircle, Eye, EyeOff } from 'lucide-react-native';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const loginIllustration = require('../../assets/splash/login_illustration.jpg');

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuthStore();

  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
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
          {/* ── Top Artistic Illustration Area ── */}
          <View style={styles.topArtArea}>
            <View style={styles.circleTopLeft} />

            <Image
              source={loginIllustration}
              style={styles.illustration}
              resizeMode="contain"
            />

            <View style={styles.circleMidRight} />
          </View>

          {/* ── Main Form Container ── */}
          <View style={styles.formContainer}>
            {/* Centered Typography */}
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to your meal subscription</Text>

            {/* Error Message */}
            {(error || localError) ? (
              <View style={styles.errorBox}>
                <AlertCircle color={Colors.danger} size={15} />
                <Text style={styles.errorText}>{localError || error}</Text>
              </View>
            ) : null}

            {/* ── Minimal Underline Input Fields ── */}
            {/* Email or Phone */}
            <View style={styles.fieldGroup}>
              <Text
                style={[
                  styles.floatingLabel,
                  (focusedField === 'login' || loginInput.length > 0) &&
                    styles.floatingLabelVisible,
                  focusedField === 'login' && styles.floatingLabelFocused,
                ]}
              >
                Email or Phone
              </Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.textInput}
                  placeholder={
                    focusedField === 'login' || loginInput.length > 0
                      ? ''
                      : 'Email or Phone'
                  }
                  placeholderTextColor="#9CA3AF"
                  value={loginInput}
                  onChangeText={(text) => {
                    setLoginInput(text);
                    setLocalError('');
                  }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  onFocus={() => setFocusedField('login')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
              <View
                style={[
                  styles.underline,
                  focusedField === 'login' && styles.underlineFocused,
                ]}
              />
            </View>

            {/* Password */}
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

            {/* ── Log in CTA (Pill Button in Saffron) ── */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                isLoading && styles.submitButtonDisabled,
              ]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>Log in</Text>
              )}
            </TouchableOpacity>

            {/* ── Footer ── */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                <Text style={styles.footerLink}>Sign Up</Text>
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
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginTop: 8,
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
  },
  illustration: {
    width: 220,
    height: 160,
  },
  circleTopLeft: {
    position: 'absolute',
    top: 24,
    left: 28,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.8,
    borderColor: '#FED7AA',
    backgroundColor: '#FFF7ED',
  },
  circleMidRight: {
    position: 'absolute',
    top: 90,
    right: 28,
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.8,
    borderColor: '#FED7AA',
    backgroundColor: '#FFF7ED',
  },

  // ── Main Form Container ──
  formContainer: {
    paddingHorizontal: 36,
    paddingTop: 8,
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
    marginBottom: 28,
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

  // ── Sign Up CTA (Pill Button) ──
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: 26,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
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
