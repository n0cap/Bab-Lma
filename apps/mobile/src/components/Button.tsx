import React, { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { colors, fonts, radius, spacing } from '../theme';

interface ButtonProps {
  variant: 'primary' | 'clay' | 'outline' | 'ghost' | 'xs';
  label: string;
  onPress: () => void;
  disabled?: boolean;
  icon?: ReactNode;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  variant,
  label,
  onPress,
  disabled = false,
  icon,
  loading = false,
  style,
}: ButtonProps) {
  const isXs = variant === 'xs';

  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        isXs ? styles.xsBase : styles.regularBase,
        variantStyles[variant],
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' || variant === 'clay' ? colors.white : colors.navy}
        />
      ) : (
        <View style={styles.content}>
          {icon}
          <Text style={[styles.text, isXs ? styles.xsText : styles.regularText, textStyles[variant]]}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const textStyles = StyleSheet.create({
  primary: { color: colors.white },
  clay: { color: colors.white },
  outline: { color: colors.navy },
  ghost: { color: colors.navy },
  xs: { color: colors.navy },
});

const variantStyles = StyleSheet.create({
  primary: { backgroundColor: colors.navy },
  clay: { backgroundColor: colors.clay },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.navy,
  },
  ghost: { backgroundColor: colors.bgAlt },
  xs: { backgroundColor: colors.bgAlt },
});

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  regularBase: {
    height: 52,
    width: '100%',
    borderRadius: radius.full,
  },
  xsBase: {
    height: 30,
    width: 'auto',
    borderRadius: radius.sm,
    paddingHorizontal: 12,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.35,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  text: {
    fontFamily: fonts.dmSans.bold,
    textAlign: 'center',
  },
  regularText: {
    fontSize: 15,
  },
  xsText: {
    fontSize: 11,
  },
});
