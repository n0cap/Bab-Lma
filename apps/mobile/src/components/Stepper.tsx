import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, spacing } from '../theme';

interface StepperProps {
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
  min?: number;
  max?: number;
}

export function Stepper({ value, onIncrement, onDecrement, min, max }: StepperProps) {
  const canDecrement = min === undefined || value > min;
  const canIncrement = max === undefined || value < max;

  return (
    <View style={styles.container}>
      <Pressable
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed, !canDecrement && styles.disabled]}
        onPress={onDecrement}
        disabled={!canDecrement}
        accessibilityRole="button"
        accessibilityLabel="Decrease"
        accessibilityState={{ disabled: !canDecrement }}
      >
        <Text style={styles.symbol}>−</Text>
      </Pressable>

      <Text style={styles.value} accessibilityLabel={`Value ${value}`}>
        {value}
      </Text>

      <Pressable
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed, !canIncrement && styles.disabled]}
        onPress={onIncrement}
        disabled={!canIncrement}
        accessibilityRole="button"
        accessibilityLabel="Increase"
        accessibilityState={{ disabled: !canIncrement }}
      >
        <Text style={styles.symbol}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  button: {
    width: 34,
    height: 34,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    backgroundColor: colors.bg,
  },
  disabled: {
    opacity: 0.35,
  },
  symbol: {
    color: colors.navy,
    fontFamily: fonts.dmSans.regular,
    fontSize: 18,
    lineHeight: 18,
  },
  value: {
    minWidth: 30,
    textAlign: 'center',
    color: colors.navy,
    fontFamily: fonts.dmSans.bold,
    fontSize: 22,
  },
});
