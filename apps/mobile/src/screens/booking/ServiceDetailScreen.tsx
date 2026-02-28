import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { BookingStackParamList } from '../../navigation/BookingStack';
import { usePricingEstimate } from '../../services/mutations/orders';
import { colors, textStyles, spacing } from '../../theme';

type Nav = NativeStackNavigationProp<BookingStackParamList>;
type Route = RouteProp<BookingStackParamList, 'ServiceDetail'>;

export function ServiceDetailScreen() {
  const nav = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { serviceType } = route.params;
  const estimate = usePricingEstimate();

  // ménage state
  const [surface, setSurface] = useState('');
  const [cleanType, setCleanType] = useState<'simple' | 'deep'>('simple');
  const [teamType, setTeamType] = useState<'solo' | 'duo' | 'squad'>('solo');
  // cuisine state
  const [guests, setGuests] = useState('');
  // childcare state
  const [children, setChildren] = useState('');
  const [hours, setHours] = useState('');

  // Build params for estimate
  const getParams = (): Record<string, unknown> | null => {
    switch (serviceType) {
      case 'menage': {
        const s = parseInt(surface, 10);
        if (!s || s < 20) return null;
        return { serviceType, surface: s, cleanType, teamType };
      }
      case 'cuisine': {
        const g = parseInt(guests, 10);
        if (!g || g < 1) return null;
        return { serviceType, guests: g };
      }
      case 'childcare': {
        const c = parseInt(children, 10);
        const h = parseInt(hours, 10);
        if (!c || c < 1 || !h || h < 1) return null;
        return { serviceType, children: c, hours: h };
      }
      default:
        return null;
    }
  };

  // Auto-fetch estimate when params change
  useEffect(() => {
    const params = getParams();
    if (params) {
      estimate.mutate(params);
    }
  }, [surface, cleanType, teamType, guests, children, hours]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleContinue = () => {
    const params = getParams();
    if (!params || !estimate.data) return;

    const { serviceType: _st, ...detail } = params;
    nav.navigate('OrderConfirm', {
      serviceType,
      detail: { serviceType, ...detail },
      estimate: estimate.data,
    });
  };

  const renderForm = () => {
    switch (serviceType) {
      case 'menage':
        return (
          <>
            <Text style={styles.label}>Surface (m²)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 80"
              placeholderTextColor={colors.textMuted}
              value={surface}
              onChangeText={setSurface}
              keyboardType="number-pad"
            />
            <Text style={styles.label}>Type de nettoyage</Text>
            <View style={styles.row}>
              {(['simple', 'deep'] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.chip, cleanType === t && styles.chipActive]}
                  onPress={() => setCleanType(t)}
                >
                  <Text style={[styles.chipText, cleanType === t && styles.chipTextActive]}>
                    {t === 'simple' ? 'Simple' : 'En profondeur'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.label}>Équipe</Text>
            <View style={styles.row}>
              {(['solo', 'duo', 'squad'] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.chip, teamType === t && styles.chipActive]}
                  onPress={() => setTeamType(t)}
                >
                  <Text style={[styles.chipText, teamType === t && styles.chipTextActive]}>
                    {t === 'solo' ? 'Solo' : t === 'duo' ? 'Duo' : 'Équipe'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        );
      case 'cuisine':
        return (
          <>
            <Text style={styles.label}>Nombre de convives</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 6"
              placeholderTextColor={colors.textMuted}
              value={guests}
              onChangeText={setGuests}
              keyboardType="number-pad"
            />
          </>
        );
      case 'childcare':
        return (
          <>
            <Text style={styles.label}>Nombre d'enfants</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 2"
              placeholderTextColor={colors.textMuted}
              value={children}
              onChangeText={setChildren}
              keyboardType="number-pad"
            />
            <Text style={styles.label}>Durée (heures)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 3"
              placeholderTextColor={colors.textMuted}
              value={hours}
              onChangeText={setHours}
              keyboardType="number-pad"
            />
          </>
        );
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.back}>
          <Text style={[textStyles.body, { color: colors.navy }]}>← Retour</Text>
        </TouchableOpacity>

        <Text style={[textStyles.h1, { color: colors.navy, marginBottom: spacing.lg }]}>
          {serviceType === 'menage' ? 'Ménage' : serviceType === 'cuisine' ? 'Cuisine' : 'Garde d\'enfants'}
        </Text>

        {renderForm()}

        {/* Price estimate */}
        {estimate.data && (
          <View style={styles.estimateBox}>
            <Text style={[textStyles.h3, { color: colors.navy }]}>Estimation</Text>
            <Text style={[textStyles.h2, { color: colors.clay, marginTop: 4 }]}>
              {estimate.data.floorPrice} — {estimate.data.ceiling} MAD
            </Text>
            <Text style={[textStyles.body, { color: colors.textSec, marginTop: 2 }]}>
              Durée: {estimate.data.durationMinutes.min}–{estimate.data.durationMinutes.max} min
            </Text>
          </View>
        )}

        {estimate.isPending && (
          <ActivityIndicator color={colors.navy} style={{ marginTop: spacing.md }} />
        )}

        <TouchableOpacity
          style={[styles.btn, (!getParams() || !estimate.data) && styles.btnDisabled]}
          onPress={handleContinue}
          disabled={!getParams() || !estimate.data}
        >
          <Text style={styles.btnText}>Continuer</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.lg,
    paddingTop: 80,
  },
  back: { marginBottom: spacing.xl },
  label: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 13,
    color: colors.navy,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    color: colors.textPrimary,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  chipText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 13,
    color: colors.textPrimary,
  },
  chipTextActive: {
    color: colors.white,
  },
  estimateBox: {
    backgroundColor: colors.clayTint,
    borderRadius: 14,
    padding: spacing.lg,
    marginTop: spacing.lg,
  },
  btn: {
    backgroundColor: colors.navy,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  btnDisabled: { opacity: 0.4 },
  btnText: {
    color: colors.white,
    fontFamily: 'DMSans_700Bold',
    fontSize: 15,
  },
});
