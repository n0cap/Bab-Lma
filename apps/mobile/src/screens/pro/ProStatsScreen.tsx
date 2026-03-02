import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, textStyles } from '../../theme';

export function ProStatsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top + 8, 52) }]}>
        <Text style={styles.title}>Mes statistiques</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.placeholder}>Statistiques détaillées — bientôt</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    ...textStyles.h1,
    color: colors.navy,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  placeholder: {
    ...textStyles.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
