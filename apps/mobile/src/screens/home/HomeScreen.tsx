import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../../navigation/HomeStack';
import { colors, textStyles, spacing } from '../../theme';

type Nav = NativeStackNavigationProp<HomeStackParamList>;

export function HomeScreen() {
  const nav = useNavigation<Nav>();

  return (
    <View style={styles.container}>
      <Text style={[textStyles.display, { color: colors.navy }]}>Babloo</Text>
      <Text style={[textStyles.body, { color: colors.textSec, marginTop: spacing.sm }]}>
        Vos services à domicile
      </Text>

      <TouchableOpacity
        style={styles.bookBtn}
        onPress={() => nav.navigate('ServiceSelection')}
      >
        <Text style={styles.bookBtnText}>Réserver un service</Text>
      </TouchableOpacity>

      {/* Service quick cards */}
      <View style={styles.grid}>
        {[
          { key: 'menage' as const, label: 'Ménage', desc: 'Nettoyage' },
          { key: 'cuisine' as const, label: 'Cuisine', desc: 'Repas' },
          { key: 'childcare' as const, label: 'Garde', desc: 'Enfants' },
        ].map((svc) => (
          <TouchableOpacity
            key={svc.key}
            style={styles.quickCard}
            onPress={() => nav.navigate('ServiceDetail', { serviceType: svc.key })}
          >
            <Text style={[textStyles.h3, { color: colors.navy }]}>{svc.label}</Text>
            <Text style={[textStyles.body, { color: colors.textMuted, marginTop: 2 }]}>{svc.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.lg,
    paddingTop: 80,
  },
  bookBtn: {
    backgroundColor: colors.navy,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
  },
  bookBtnText: {
    color: colors.white,
    fontFamily: 'DMSans_700Bold',
    fontSize: 16,
  },
  grid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  quickCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.md,
    alignItems: 'center',
  },
});
