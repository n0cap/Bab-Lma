import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BookingStackParamList } from '../../navigation/BookingStack';
import { colors, textStyles, spacing } from '../../theme';

type Nav = NativeStackNavigationProp<BookingStackParamList>;

const SERVICES = [
  { key: 'menage' as const, label: 'Ménage', desc: 'Nettoyage et entretien' },
  { key: 'cuisine' as const, label: 'Cuisine', desc: 'Préparation de repas' },
  { key: 'childcare' as const, label: 'Garde d\'enfants', desc: 'Baby-sitting à domicile' },
];

export function ServiceSelectionScreen() {
  const nav = useNavigation<Nav>();

  return (
    <View style={styles.container}>
      <Text style={[textStyles.h1, { color: colors.navy, marginBottom: spacing.xl }]}>
        Choisissez un service
      </Text>

      {SERVICES.map((svc) => (
        <TouchableOpacity
          key={svc.key}
          style={styles.card}
          onPress={() => nav.navigate('ServiceDetail', { serviceType: svc.key })}
        >
          <Text style={[textStyles.h2, { color: colors.navy }]}>{svc.label}</Text>
          <Text style={[textStyles.body, { color: colors.textSec, marginTop: 4 }]}>{svc.desc}</Text>
        </TouchableOpacity>
      ))}
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
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
});
