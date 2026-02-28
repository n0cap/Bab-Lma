import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { BookingStackParamList } from '../../navigation/BookingStack';
import { useCreateOrder } from '../../services/mutations/orders';
import { colors, textStyles, spacing } from '../../theme';

type Route = RouteProp<BookingStackParamList, 'OrderConfirm'>;

const SERVICE_LABELS: Record<string, string> = {
  menage: 'Ménage',
  cuisine: 'Cuisine',
  childcare: 'Garde d\'enfants',
};

export function OrderConfirmScreen() {
  const nav = useNavigation();
  const route = useRoute<Route>();
  const { serviceType, detail, estimate } = route.params;
  const createOrder = useCreateOrder();
  const [location, setLocation] = useState('');

  const handleConfirm = () => {
    if (!location.trim()) {
      Alert.alert('Localisation requise', 'Veuillez entrer votre adresse.');
      return;
    }

    createOrder.mutate(
      {
        serviceType,
        location: location.trim(),
        detail: detail as any,
      },
      {
        onSuccess: () => {
          // Navigate back to orders list tab
          nav.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'MainTabs', params: { screen: 'OrdersTab' } }],
            }),
          );
        },
        onError: (err: any) => {
          Alert.alert(
            'Erreur',
            err?.response?.data?.error?.message ?? 'Impossible de créer la commande',
          );
        },
      },
    );
  };

  const renderDetailSummary = () => {
    switch (serviceType) {
      case 'menage':
        return (
          <>
            <SummaryRow label="Surface" value={`${detail.surface} m²`} />
            <SummaryRow label="Nettoyage" value={detail.cleanType === 'deep' ? 'En profondeur' : 'Simple'} />
            <SummaryRow label="Équipe" value={detail.teamType === 'solo' ? 'Solo' : detail.teamType === 'duo' ? 'Duo' : 'Équipe'} />
          </>
        );
      case 'cuisine':
        return <SummaryRow label="Convives" value={`${detail.guests}`} />;
      case 'childcare':
        return (
          <>
            <SummaryRow label="Enfants" value={`${detail.children}`} />
            <SummaryRow label="Durée" value={`${detail.hours}h`} />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.back}>
          <Text style={[textStyles.body, { color: colors.navy }]}>← Retour</Text>
        </TouchableOpacity>

        <Text style={[textStyles.h1, { color: colors.navy, marginBottom: spacing.lg }]}>
          Confirmer la commande
        </Text>

        {/* Service summary */}
        <View style={styles.summaryCard}>
          <Text style={[textStyles.h2, { color: colors.navy, marginBottom: spacing.sm }]}>
            {SERVICE_LABELS[serviceType] ?? serviceType}
          </Text>
          {renderDetailSummary()}
        </View>

        {/* Price estimate */}
        <View style={styles.estimateBox}>
          <Text style={[textStyles.h3, { color: colors.navy }]}>Estimation de prix</Text>
          <Text style={[textStyles.h2, { color: colors.clay, marginTop: 4 }]}>
            {estimate.floorPrice} — {estimate.ceiling} MAD
          </Text>
          <Text style={[textStyles.body, { color: colors.textSec, marginTop: 2 }]}>
            Durée: {estimate.durationMinutes.min}–{estimate.durationMinutes.max} min
          </Text>
        </View>

        {/* Location input */}
        <Text style={styles.label}>Adresse</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Casablanca, Maarif"
          placeholderTextColor={colors.textMuted}
          value={location}
          onChangeText={setLocation}
        />

        {/* Confirm button */}
        <TouchableOpacity
          style={[styles.btn, createOrder.isPending && styles.btnDisabled]}
          onPress={handleConfirm}
          disabled={createOrder.isPending}
        >
          {createOrder.isPending ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.btnText}>Confirmer</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={summaryStyles.row}>
      <Text style={summaryStyles.label}>{label}</Text>
      <Text style={summaryStyles.value}>{value}</Text>
    </View>
  );
}

const summaryStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  label: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: colors.textSec,
  },
  value: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 13,
    color: colors.navy,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.lg,
    paddingTop: 80,
  },
  back: { marginBottom: spacing.xl },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  estimateBox: {
    backgroundColor: colors.clayTint,
    borderRadius: 14,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
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
  btn: {
    backgroundColor: colors.navy,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: {
    color: colors.white,
    fontFamily: 'DMSans_700Bold',
    fontSize: 15,
  },
});
