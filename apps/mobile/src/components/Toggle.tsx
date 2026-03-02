import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, radius, shadows } from '../theme';

interface ToggleProps {
  value: boolean;
  onToggle: () => void;
}

export function Toggle({ value, onToggle }: ToggleProps) {
  return (
    <Pressable
      style={[styles.track, value ? styles.trackOn : styles.trackOff]}
      onPress={onToggle}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel="Toggle"
    >
      <View style={[styles.knob, value && styles.knobOn]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: 42,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  trackOff: {
    backgroundColor: colors.border,
  },
  trackOn: {
    backgroundColor: colors.navy,
  },
  knob: {
    width: 18,
    height: 18,
    borderRadius: radius.full,
    backgroundColor: colors.white,
    ...shadows.sm,
  },
  knobOn: {
    transform: [{ translateX: 18 }],
  },
});
