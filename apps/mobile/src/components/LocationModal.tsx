import React, { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Input } from './Input';
import { CheckIcon, CloseIcon } from './icons';
import { colors, radius, spacing, textStyles } from '../theme';

interface LocationModalProps {
  visible: boolean;
  onClose: () => void;
  selectedZone: string;
  onSelectZone: (zone: string) => void;
}

const ZONES = [
  { name: 'Agdal', city: 'Rabat · Quartier actuel', dot: colors.success },
  { name: 'Hay Riad', city: 'Rabat', dot: colors.success },
  { name: 'Hassan', city: 'Rabat · Centre', dot: colors.success },
  { name: 'Salé Médina', city: 'Salé', dot: colors.proB },
  { name: 'Tabriquet', city: 'Salé', dot: colors.proB },
];

export function LocationModal({ visible, onClose, selectedZone, onSelectZone }: LocationModalProps) {
  const [query, setQuery] = useState('');

  const filteredZones = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return ZONES;
    return ZONES.filter((zone) =>
      `${zone.name} ${zone.city}`.toLowerCase().includes(normalized),
    );
  }, [query]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
          <View style={styles.handle} />
          <Text style={styles.title}>Adresse de service</Text>
          <Text style={styles.subtitle}>Babloo opère uniquement dans Rabat et Salé</Text>

          <Input
            value={query}
            onChangeText={setQuery}
            placeholder="Rechercher une adresse..."
            style={styles.searchInput}
          />

          <Text style={styles.sectionLabel}>ZONES DISPONIBLES</Text>

          <View>
            {filteredZones.map((zone) => {
              const isSelected = selectedZone === zone.name;
              return (
                <Pressable
                  key={zone.name}
                  style={[styles.zonePill, isSelected && styles.zonePillSelected]}
                  onPress={() => onSelectZone(zone.name)}
                  accessibilityRole="button"
                  accessibilityLabel={`Zone ${zone.name}`}
                >
                  <View style={[styles.zoneDot, { backgroundColor: zone.dot }]} />
                  <View style={styles.zoneTextWrap}>
                    <Text style={styles.zoneName}>{zone.name}</Text>
                    <Text style={styles.zoneCity}>{zone.city}</Text>
                  </View>
                  {isSelected ? <CheckIcon size={14} color={colors.navy} /> : null}
                </Pressable>
              );
            })}
          </View>

          <View style={styles.warningBox}>
            <CloseIcon size={14} color={colors.error} />
            <Text style={styles.warningText}>
              Les adresses hors de Rabat-Salé ne sont pas encore disponibles. Babloo arrive bientôt
              dans d&apos;autres villes.
            </Text>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(14,20,66,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: 16,
    paddingBottom: spacing['2xl'],
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.borderStrong,
    alignSelf: 'center',
    marginBottom: 18,
  },
  title: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 18,
    color: colors.navy,
    marginBottom: 4,
  },
  subtitle: {
    ...textStyles.body,
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: spacing.md,
  },
  searchInput: {
    marginBottom: spacing.md,
  },
  sectionLabel: {
    ...textStyles.label,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  zonePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: 16,
    marginBottom: spacing.sm,
  },
  zonePillSelected: {
    borderColor: colors.navy,
    backgroundColor: 'rgba(14,20,66,0.03)',
  },
  zoneDot: {
    width: 10,
    height: 10,
    borderRadius: radius.full,
  },
  zoneTextWrap: {
    flex: 1,
  },
  zoneName: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 13,
    color: colors.navy,
  },
  zoneCity: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  warningBox: {
    marginTop: spacing.xs,
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(176,35,15,0.18)',
    backgroundColor: 'rgba(176,35,15,0.06)',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  warningText: {
    ...textStyles.body,
    color: colors.error,
    fontSize: 11,
    lineHeight: 17,
    flex: 1,
  },
});
