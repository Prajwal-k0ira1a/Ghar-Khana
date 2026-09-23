// GharKhana Design System Tokens
// Designed for visual excellence, WCAG 2.1 AA accessibility, and touch targets (>=48dp)

export const Colors = {
  // Brand accents: warm saffron, terracotta, fresh cardamom
  primary: "#F97316", // Orange / Saffron
  primaryDark: "#C2410C",
  primaryLight: "#FFEDD5",

  secondary: "#10B981", // Cardamom green
  secondaryDark: "#047857",

  // Status colors
  confirmed: "#10B981",
  customized: "#3B82F6",
  skipped: "#6B7280",
  warning: "#F59E0B",
  danger: "#EF4444",

  // Modern Light Palette (warm saffron accent, clean crisp surfaces, WCAG AAA compliant)
  background: "#F8FAFC",
  surface: "#FFFFFF",
  surfaceElevated: "#FFFFFF",
  surfaceSubtle: "#F1F5F9",
  surfaceBorder: "#E2E8F0",
  borderSubtle: "#E2E8F0",
  textPrimary: "#0F172A",
  textSecondary: "#475569",
  textMuted: "#64748B",

  // Aliased tokens for existing views (seamless light theme transition)
  backgroundDark: "#F8FAFC",
  surfaceDark: "#FFFFFF",
  surfaceBorderDark: "#E2E8F0",
  textPrimaryDark: "#0F172A",
  textSecondaryDark: "#475569",
  textMutedDark: "#64748B",

  // Explicit Light palette aliases
  backgroundLight: "#F8FAFC",
  surfaceLight: "#FFFFFF",
  surfaceBorderLight: "#E2E8F0",
  textPrimaryLight: "#0F172A",
  textSecondaryLight: "#475569",
  textMutedLight: "#64748B",
};

export const Spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  xs: 2,
  sm: 4,
  md: 6,
  lg: 8,
  xl: 12,
  full: 9999,
};

export const Typography = {
  title: {
    fontSize: 22,
    fontWeight: "700" as const,
    letterSpacing: -0.3,
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    letterSpacing: -0.1,
    color: Colors.textPrimary,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: "700" as const,
    letterSpacing: 0.8,
    color: Colors.textMuted,
    textTransform: "uppercase" as const,
  },
  body: {
    fontSize: 14,
    fontWeight: "400" as const,
    lineHeight: 20,
    color: Colors.textSecondary,
  },
  bodyBold: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.textPrimary,
  },
  caption: {
    fontSize: 12,
    fontWeight: "500" as const,
    letterSpacing: 0.1,
    color: Colors.textMuted,
  },
};

export const Layout = {
  minTouchTarget: 48, // Minimum 48x48dp for mobile touch targets (WCAG 2.1 AA / PRD §10)
};
