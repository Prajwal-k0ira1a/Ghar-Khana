import React from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
  type StyleProp,
} from "react-native";
import { Colors, BorderRadius, Layout, Spacing } from "../../theme/tokens";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "neutral" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  style,
  textStyle,
  leftIcon,
  rightIcon,
}) => {
  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case "secondary":
        return styles.secondary;
      case "neutral":
        return styles.neutral;
      case "outline":
        return styles.outline;
      case "ghost":
        return styles.ghost;
      case "danger":
        return styles.danger;
      default:
        return styles.primary;
    }
  };

  const getTextStyle = (): TextStyle => {
    switch (variant) {
      case "neutral":
        return styles.neutralText;
      case "outline":
      case "ghost":
        return styles.outlineText;
      case "danger":
        return styles.dangerText;
      default:
        return styles.primaryText;
    }
  };

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      activeOpacity={0.8}
      disabled={disabled || loading}
      hitSlop={
        size === "sm" ? { top: 6, bottom: 6, left: 6, right: 6 } : undefined
      }
      onPress={onPress}
      style={[
        styles.base,
        getVariantStyle(),
        size === "lg" && styles.sizeLg,
        size === "sm" && styles.sizeSm,
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={
            variant === "outline" || variant === "ghost"
              ? Colors.primary
              : "#FFFFFF"
          }
          size="small"
        />
      ) : (
        <>
          {leftIcon}
          <Text
            style={[getTextStyle(), size === "sm" && styles.textSm, textStyle]}
          >
            {title}
          </Text>
          {rightIcon}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    minHeight: Layout.minTouchTarget, // 48dp
    minWidth: Layout.minTouchTarget,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  sizeSm: {
    minHeight: 40,
    paddingHorizontal: Spacing.md,
  },
  sizeLg: {
    minHeight: 52,
    paddingHorizontal: Spacing.xl,
  },
  primary: {
    backgroundColor: Colors.primary,
  },
  secondary: {
    backgroundColor: Colors.secondary,
  },
  neutral: {
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  ghost: {
    backgroundColor: "transparent",
  },
  danger: {
    backgroundColor: Colors.danger,
  },
  disabled: {
    opacity: 0.5,
  },
  primaryText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  neutralText: {
    color: Colors.textPrimaryDark,
    fontSize: 15,
    fontWeight: "600",
  },
  outlineText: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: "600",
  },
  dangerText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  textSm: {
    fontSize: 13,
  },
});
