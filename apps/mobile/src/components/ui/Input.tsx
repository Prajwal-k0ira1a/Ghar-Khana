import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { Colors, BorderRadius, Layout, Spacing } from '../../theme/tokens';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  leftIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  containerStyle,
  leftIcon,
  style,
  secureTextEntry,
  ...props
}) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const isPasswordField = Boolean(secureTextEntry);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputWrapper, !!error && styles.inputWrapperError]}>
        {leftIcon && <View style={styles.iconContainer}>{leftIcon}</View>}
        <TextInput
          placeholderTextColor={Colors.textMutedDark}
          style={[styles.input, style]}
          {...props}
          secureTextEntry={isPasswordField && !isPasswordVisible}
        />
        {isPasswordField && (
          <TouchableOpacity
            accessibilityLabel={isPasswordVisible ? 'Hide password' : 'Show password'}
            accessibilityRole="button"
            hitSlop={Spacing.sm}
            onPress={() => setIsPasswordVisible((visible) => !visible)}
            style={styles.passwordToggle}
          >
            {isPasswordVisible ? (
              <EyeOff color={Colors.textMutedDark} size={20} />
            ) : (
              <Eye color={Colors.textMutedDark} size={20} />
            )}
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondaryDark,
    marginBottom: Spacing.xs,
  },
  inputWrapper: {
    minHeight: Layout.minTouchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.surfaceBorderDark,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
  },
  inputWrapperError: {
    borderColor: Colors.danger,
  },
  iconContainer: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    color: Colors.textPrimaryDark,
    fontSize: 14,
    paddingVertical: Spacing.sm,
  },
  passwordToggle: {
    marginLeft: Spacing.sm,
    padding: Spacing.xs,
  },
  errorText: {
    fontSize: 12,
    color: Colors.danger,
    marginTop: Spacing.xs,
  },
});
