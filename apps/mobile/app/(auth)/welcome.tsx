import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../src/components/ui/Button';
import { Colors, Spacing } from '../../src/theme/tokens';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// eslint-disable-next-line @typescript-eslint/no-require-imports
const welcomeIllustration = require('../../assets/splash/login_illustration.jpg');

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.container}>
        {/* ── Top Section: Illustration ── */}
        <View style={styles.illustrationSection}>
          {/* Decorative background shapes */}
          <View style={styles.bgCircleLarge} />
          <View style={styles.bgCircleSmall} />
          <View style={styles.bgDot1} />
          <View style={styles.bgDot2} />

          <Image
            source={welcomeIllustration}
            style={styles.illustration}
            resizeMode="contain"
          />
        </View>

        {/* ── Bottom Section: Content ── */}
        <View style={styles.contentSection}>
          {/* Brand */}
          <Text style={styles.brandMark}>GharKhana</Text>

          {/* Title */}
          <Text style={styles.title}>Welcome</Text>
          <Text style={styles.subtitle}>
            Your daily home-cooked meals,{'\n'}managed effortlessly
          </Text>

          {/* Buttons */}
          <View style={styles.buttonsArea}>
            <Button
              onPress={() => router.push('/(auth)/login')}
              size="lg"
              variant="outline"
              style={styles.loginButton}
              textStyle={styles.loginButtonText}
              title="Log in"
            />

            <Button
              onPress={() => router.push('/(auth)/register')}
              size="lg"
              style={styles.signupButton}
              title="Sign Up"
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const ILLUSTRATION_HEIGHT = SCREEN_HEIGHT * 0.42;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
  },

  // ── Illustration Section ──────────────────────────────
  illustrationSection: {
    height: ILLUSTRATION_HEIGHT,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },

  // Decorative shapes
  bgCircleLarge: {
    position: 'absolute',
    width: SCREEN_WIDTH * 0.7,
    height: SCREEN_WIDTH * 0.7,
    borderRadius: SCREEN_WIDTH * 0.35,
    backgroundColor: '#FFEDD5',
    top: ILLUSTRATION_HEIGHT * 0.12,
    left: SCREEN_WIDTH * 0.15,
  },
  bgCircleSmall: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FED7AA',
    opacity: 0.5,
    top: ILLUSTRATION_HEIGHT * 0.15,
    right: SCREEN_WIDTH * 0.08,
  },
  bgDot1: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
    opacity: 0.25,
    top: ILLUSTRATION_HEIGHT * 0.22,
    left: SCREEN_WIDTH * 0.12,
  },
  bgDot2: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    opacity: 0.15,
    bottom: ILLUSTRATION_HEIGHT * 0.18,
    right: SCREEN_WIDTH * 0.18,
  },

  illustration: {
    width: SCREEN_WIDTH * 0.72,
    height: ILLUSTRATION_HEIGHT * 0.88,
    zIndex: 1,
  },

  // ── Content Section ───────────────────────────────────
  contentSection: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 32,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },

  brandMark: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 8,
  },

  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: -0.8,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 8,
  },

  // Buttons
  buttonsArea: {
    gap: 12,
  },
  loginButton: {
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  loginButtonText: {
    color: '#374151',
  },
  signupButton: {
    borderRadius: 26,
  },
});
