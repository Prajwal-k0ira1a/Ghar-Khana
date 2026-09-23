import React from 'react';
import { View, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import { Colors, BorderRadius, Spacing } from '../../theme/tokens';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const Card: React.FC<CardProps> = ({ children, style }) => {
  return <View style={[styles.card, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceDark,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorderDark,
  },
});
