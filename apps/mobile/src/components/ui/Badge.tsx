import React from 'react';
import { View, Text, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import { BorderRadius } from '../../theme/tokens';

export type BadgeVariant = 'confirmed' | 'customized' | 'skipped' | 'warning' | 'default';

interface BadgeProps {
  label: string;
  glyph?: string;
  variant?: BadgeVariant;
  style?: StyleProp<ViewStyle>;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  glyph,
  variant = 'default',
  style,
}) => {
  const getColors = () => {
    switch (variant) {
      case 'confirmed':
        return { bg: '#ECFDF5', text: '#059669' };
      case 'customized':
        return { bg: '#EFF6FF', text: '#2563EB' };
      case 'skipped':
        return { bg: '#F1F5F9', text: '#64748B' };
      case 'warning':
        return { bg: '#FEF3C7', text: '#D97706' };
      default:
        return { bg: '#FFF7ED', text: '#EA580C' };
    }
  };

  const { bg, text } = getColors();

  return (
    <View style={[styles.badge, { backgroundColor: bg }, style]}>
      {glyph ? (
        <Text style={[styles.glyph, { color: text }]}>{glyph}</Text>
      ) : null}
      <Text style={[styles.text, { color: text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
    gap: 4,
    alignSelf: 'flex-start',
  },
  glyph: {
    fontSize: 10,
    fontWeight: '700',
  },
  text: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
