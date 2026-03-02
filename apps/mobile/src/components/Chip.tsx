import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, fonts, radius } from '../theme';

interface ChipProps {
  label: string;
  variant: 'default' | 'navy' | 'success' | 'clay' | 'warning';
  style?: StyleProp<ViewStyle>;
}

export function Chip({ label, variant, style }: ChipProps) {
  return (
    <View style={[styles.base, variantStyles[variant], style]} accessibilityLabel={label}>
      <Text style={[styles.text, textStyles[variant]]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderRadius: radius.full,
    borderWidth: 1.5,
  },
  text: {
    fontFamily: fonts.dmSans.bold,
    fontSize: 10,
  },
});

const variantStyles = StyleSheet.create({
  default: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  navy: {
    backgroundColor: 'rgba(14,20,66,0.07)',
    borderColor: 'rgba(14,20,66,0.14)',
  },
  success: {
    backgroundColor: colors.successBg,
    borderColor: colors.success,
  },
  clay: {
    backgroundColor: colors.clayTint,
    borderColor: colors.clayLight,
  },
  warning: {
    backgroundColor: colors.warningBg,
    borderColor: colors.warning,
  },
});

const textStyles = StyleSheet.create({
  default: { color: colors.textSec },
  navy: { color: colors.navy },
  success: { color: colors.success },
  clay: { color: colors.clay },
  warning: { color: colors.warning },
});
