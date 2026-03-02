import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { BookingStackParamList } from '../../navigation/BookingStack';
import { useCreateOrder } from '../../services/mutations/orders';
import { BackHeader, Button, Card, Chip, Input } from '../../components';
import { ChatIcon, ChevronRightIcon } from '../../components';
import { colors, radius, spacing, textStyles } from '../../theme';

type Route = RouteProp<BookingStackParamList, 'OrderConfirm'>;

const SERVICE_LABELS: Record<string, string> = {
  menage: 'Ménage',
  cuisine: 'Cuisine',
  childcare: 'Garde d\'enfants',
};

export function OrderConfirmScreen() {
  const nav = useNavigation<any>();
  const route = useRoute<Route>();
  const { serviceType, detail, estimate } = route.params;
  const detailData = detail as any;
  const createOrder = useCreateOrder();
  const [location, setLocation] = useState('');

  const subtitle = useMemo(() => {
    if (serviceType === 'menage') return `${detailData.cleanType === 'deep' ? 'Ménage profond' : 'Ménage simple'} · ${detailData.surface}m²`;
    if (serviceType === 'cuisine') return `${detailData.guests} convives`;
    return `${detailData.children} enfant${detailData.children > 1 ? 's' : ''} · ${detailData.hours}h`;
  }, [detailData, serviceType]);

  const rows = useMemo(() => {
    if (serviceType === 'menage') {
      return [
        { label: 'Type', value: detail.cleanType === 'deep' ? 'Ménage profond' : 'Ménage simple' },
        { label: 'Superficie', value: `${detailData.surface} m²` },
        { label: 'Équipe', value: detailData.teamType === 'solo' ? 'Solo' : detailData.teamType === 'duo' ? 'Duo' : 'Squad' },
        { label: 'Durée', value: `${estimate.durationMinutes.min}–${estimate.durationMinutes.max} min` },
      ];
    }
    if (serviceType === 'cuisine') {
      return [
        { label: 'Type', value: 'Préparation culinaire' },
        { label: 'Convives', value: `${detailData.guests}` },
        { label: 'Équipe', value: 'Solo' },
        { label: 'Durée', value: `${estimate.durationMinutes.min}–${estimate.durationMinutes.max} min` },
      ];
    }
    return [
      { label: 'Type', value: 'Garde d\'enfants' },
      { label: 'Enfants', value: `${detailData.children}` },
      { label: 'Équipe', value: 'Solo' },
      { label: 'Durée', value: `${detailData.hours}h` },
    ];
  }, [detailData, estimate.durationMinutes.max, estimate.durationMinutes.min, serviceType]);

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
        onSuccess: (result: { id: string }) => {
          nav.navigate('Search', { orderId: result.id });
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

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <BackHeader title="Récapitulatif" onBack={() => nav.goBack()} right={<Chip label="Étape 2/3" variant="navy" />} />

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Card style={styles.recapCard}>
          <View style={styles.recapHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.tLabel}>SERVICE COMMANDÉ</Text>
              <Text style={styles.recapTitle}>{SERVICE_LABELS[serviceType] ?? serviceType}</Text>
              <Text style={styles.recapSubtitle}>{subtitle}</Text>
            </View>
            {serviceType === 'menage' ? <Chip label="1ère commande" variant="clay" /> : null}
          </View>

          <View style={styles.divider} />

          {rows.map((row) => (
            <SummaryRow key={row.label} label={row.label} value={row.value} />
          ))}
          <SummaryRow label="Adresse" value={location.trim() || 'À renseigner'} />
          <SummaryRow label="Paiement" value="Espèces à la porte" />
        </Card>

        <View style={styles.priceBlock}>
          <View>
            <Text style={styles.priceLabel}>PLANCHER MINIMUM</Text>
            <Text style={styles.priceValue}>{estimate.floorPrice} MAD</Text>
            <Text style={styles.priceNote}>Prix final négocié via le chat</Text>
          </View>
          <View style={styles.priceSide}>
            <ChatIcon size={22} color={colors.white} />
            <Text style={styles.priceSideText}>Négociation</Text>
          </View>
        </View>

        <View style={styles.nextSteps}>
          <Text style={styles.nextTitle}>Ce qui se passe ensuite</Text>
          {[
            'Babloo assigne des professionnelles disponibles dans votre quartier',
            'Vous négociez le prix final via le chat',
            'La professionnelle arrive, vous payez en espèces à la porte',
            'Vous notez la prestation',
          ].map((item, index) => (
            <View key={item} style={styles.stepItem}>
              <View style={styles.stepBadge}><Text style={styles.stepBadgeText}>{index + 1}</Text></View>
              <Text style={styles.stepText}>{item}</Text>
            </View>
          ))}
        </View>

        <Input
          label="Adresse"
          placeholder="Ex: Casablanca, Maarif"
          value={location}
          onChangeText={setLocation}
        />
      </ScrollView>

      <View style={styles.ctaBar}>
        <Button
          variant="clay"
          label="Confirmer et lancer la recherche"
          onPress={handleConfirm}
          loading={createOrder.isPending}
          icon={<ChevronRightIcon size={16} color={colors.white} />}
        />
        <Text style={styles.ctaHelper}>Aucun prépaiement requis · Offre 1er service active</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 110,
    gap: spacing.md,
  },
  recapCard: {
    padding: 18,
  },
  recapHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 14,
  },
  tLabel: {
    ...textStyles.label,
    color: colors.textMuted,
    marginBottom: 4,
  },
  recapTitle: {
    ...textStyles.h2,
    color: colors.navy,
  },
  recapSubtitle: {
    color: colors.textSec,
    fontSize: 12,
    fontFamily: 'DMSans_500Medium',
    marginTop: 2,
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginBottom: 8,
    paddingTop: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 9,
    gap: 8,
  },
  rowLabel: {
    fontSize: 13,
    color: colors.textSec,
    fontFamily: 'DMSans_400Regular',
  },
  rowValue: {
    fontSize: 13,
    color: colors.navy,
    fontFamily: 'DMSans_600SemiBold',
    maxWidth: 210,
    textAlign: 'right',
  },
  priceBlock: {
    borderRadius: radius.lg,
    backgroundColor: colors.navy,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    color: 'rgba(255,255,255,0.42)',
    fontSize: 10,
    fontFamily: 'DMSans_700Bold',
    letterSpacing: 1,
    marginBottom: 5,
  },
  priceValue: {
    color: colors.white,
    fontFamily: 'Fraunces_700Bold',
    fontSize: 28,
    lineHeight: 30,
  },
  priceNote: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 11,
    fontFamily: 'DMSans_500Medium',
    marginTop: 2,
  },
  priceSide: {
    opacity: 0.45,
    alignItems: 'center',
  },
  priceSideText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 9,
    fontFamily: 'DMSans_500Medium',
    marginTop: 2,
  },
  nextSteps: {
    borderRadius: radius.lg,
    backgroundColor: colors.bgAlt,
    padding: 16,
  },
  nextTitle: {
    ...textStyles.h3,
    color: colors.navy,
    marginBottom: 12,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
    marginBottom: 10,
  },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: radius.full,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeText: {
    color: colors.white,
    fontSize: 10,
    fontFamily: 'DMSans_700Bold',
  },
  stepText: {
    flex: 1,
    color: colors.textSec,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: 'DMSans_500Medium',
  },
  ctaBar: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 28,
    gap: spacing.sm,
  },
  ctaHelper: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 11,
    fontFamily: 'DMSans_500Medium',
  },
});
