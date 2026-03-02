import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, radius } from '../theme';

interface ProgressBarProps {
  progress: number;
  color?: string;
}

export function ProgressBar({ progress, color = colors.navy }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(1, progress));

  return (
    <View style={styles.container} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}>
      <View style={[styles.fill, { width: `${clamped * 100}%`, backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 2,
  },
});
