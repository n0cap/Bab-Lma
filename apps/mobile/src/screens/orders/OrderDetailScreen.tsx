import React from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { OrdersStackParamList } from '../../navigation/OrdersStack';
import { useOrder } from '../../services/queries/orders';
import { useCancelOrder } from '../../services/mutations/orders';
import { useCompleteOrder } from '../../services/mutations/dev';
import { BackHeader, Button, Card, Chip } from '../../components';
import { StarIcon, StarOutlineIcon } from '../../components';
import { colors, radius, spacing, textStyles } from '../../theme';

type Route = RouteProp<OrdersStackParamList, 'OrderDetail'>;
type Nav = NativeStackNavigationProp<OrdersStackParamList>;

const SERVICE_LABELS: Record<string, string> = {
  menage: 'Ménage',
  cuisine: 'Cuisine',
  childcare: 'Garde d\'enfants',
};

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string; chip: 'success' | 'warning' | 'navy' | 'default' }> = {
  draft: { label: 'Brouillon', color: colors.textMuted, bg: colors.bgAlt, chip: 'default' },
  submitted: { label: 'Soumise', color: colors.navy, bg: colors.bg, chip: 'navy' },
  searching: { label: 'Recherche', color: colors.warning, bg: colors.warningBg, chip: 'warning' },
  negotiating: { label: 'Négociation', color: colors.warning, bg: colors.warningBg, chip: 'warning' },
  accepted: { label: 'Acceptée', color: colors.success, bg: colors.successBg, chip: 'success' },
  en_route: { label: 'En route', color: colors.proA, bg: colors.bgAlt, chip: 'navy' },
  in_progress: { label: 'En cours', color: colors.proA, bg: colors.bgAlt, chip: 'navy' },
  completed: { label: 'Terminée', color: colors.success, bg: colors.successBg, chip: 'success' },
  cancelled: { label: 'Annulée', color: colors.error, bg: colors.bgAlt, chip: 'default' },
};

const CANCELLABLE = new Set(['draft', 'submitted', 'searching', 'negotiating', 'accepted', 'en_route']);

interface StatusEvent {
  id: string;
  seq: number;
  fromStatus: string;
  toStatus: string;
  createdAt: string;
  reason?: string | null;
}

export function OrderDetailScreen() {
  const nav = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { orderId } = route.params;
  const { data: order, isLoading, refetch } = useOrder(orderId);
  const cancelOrder = useCancelOrder();
  const completeOrder = useCompleteOrder();

  const handleCancel = () => {
    Alert.alert(
      'Annuler la commande',
      'Êtes-vous sûr de vouloir annuler cette commande ?',
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui, annuler',
          style: 'destructive',
          onPress: () => {
            cancelOrder.mutate(
              { orderId },
              {
                onSuccess: () => refetch(),
                onError: (err: any) => {
                  Alert.alert(
                    'Erreur',
                    err?.response?.data?.error?.message ?? 'Impossible d\'annuler',
                  );
                },
              },
            );
          },
        },
      ],
    );
  };

  if (isLoading || !order) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.navy} />
      </View>
    );
  }

  const statusInfo = STATUS_LABELS[order.status] ?? STATUS_LABELS.draft;
  const canCancel = CANCELLABLE.has(order.status);

  return (
    <View style={styles.flex}>
      <BackHeader
        title={SERVICE_LABELS[order.serviceType] ?? order.serviceType}
        onBack={() => nav.goBack()}
        right={<Chip label={statusInfo.label} variant={statusInfo.chip} />}
      />

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.priceBlock}>
          {order.finalPrice != null ? (
            <>
              <Text style={styles.priceLabel}>MONTANT PAYÉ</Text>
              <Text style={styles.priceValue}>{order.finalPrice} MAD</Text>
              <Text style={styles.priceNote}>Prix plancher : {order.floorPrice} MAD</Text>
            </>
          ) : (
            <>
              <Text style={styles.priceLabel}>PLANCHER MINIMUM</Text>
              <Text style={styles.priceValue}>{order.floorPrice} MAD</Text>
              <Text style={styles.priceNote}>Prix final négocié via le chat</Text>
            </>
          )}
        </View>

        {order.detail && (
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionLabel}>DÉTAILS</Text>
            {order.detail.surface != null && <DetailRow label="Surface" value={`${order.detail.surface} m²`} />}
            {order.detail.cleanType && <DetailRow label="Nettoyage" value={order.detail.cleanType === 'deep' ? 'En profondeur' : 'Simple'} />}
            {order.detail.teamType && <DetailRow label="Équipe" value={order.detail.teamType === 'solo' ? 'Solo' : order.detail.teamType === 'duo' ? 'Duo' : 'Squad'} />}
            {order.detail.guests != null && <DetailRow label="Convives" value={`${order.detail.guests}`} />}
            {order.detail.children != null && <DetailRow label="Enfants" value={`${order.detail.children}`} />}
            {order.detail.hours != null && <DetailRow label="Durée" value={`${order.detail.hours}h`} />}
          </Card>
        )}

        <Card style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>LOCALISATION</Text>
          <Text style={styles.locationText}>{order.location}</Text>
        </Card>

        {order.statusEvents?.length > 0 && (
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionLabel}>HISTORIQUE</Text>
            {order.statusEvents.map((evt: StatusEvent, idx: number) => {
              const toInfo = STATUS_LABELS[evt.toStatus] ?? STATUS_LABELS.draft;
              const date = new Date(evt.createdAt).toLocaleString('fr-FR', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <View key={evt.id} style={[styles.timelineRow, idx === order.statusEvents.length - 1 && { marginBottom: 0 }]}>
                  <View style={[styles.timelineDot, { backgroundColor: toInfo.color }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.timelineTitle}>{toInfo.label}</Text>
                    <Text style={styles.timelineDate}>{date}</Text>
                    {evt.reason ? <Text style={styles.timelineReason}>{evt.reason}</Text> : null}
                  </View>
                </View>
              );
            })}
          </Card>
        )}

        {order.rating && (
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionLabel}>VOTRE ÉVALUATION</Text>
            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((n) => (
                n <= order.rating.stars ? (
                  <StarIcon key={n} size={20} color={colors.navy} />
                ) : (
                  <StarOutlineIcon key={n} size={20} color="#D8D7EE" />
                )
              ))}
            </View>
            {order.rating.comment ? <Text style={styles.ratingComment}>"{order.rating.comment}"</Text> : null}
          </Card>
        )}

        {order.status === 'completed' && !order.rating && (
          <Button
            variant="outline"
            label="Évaluer le service"
            onPress={() => nav.navigate('Rating', { orderId })}
          />
        )}

        {order.status === 'negotiating' && (
          <Button
            variant="primary"
            label="Négocier"
            onPress={() => nav.navigate('Chat', { orderId })}
          />
        )}

        {__DEV__ && ['negotiating', 'accepted', 'en_route', 'in_progress'].includes(order.status) && (
          <Button
            variant="outline"
            label="[DEV] Simuler la complétion"
            onPress={() =>
              completeOrder.mutate(orderId, {
                onSuccess: () => refetch(),
                onError: (err: any) => {
                  Alert.alert(
                    'Erreur',
                    err?.response?.data?.error?.message ?? 'Impossible de compléter la commande',
                  );
                },
              })
            }
            loading={completeOrder.isPending}
          />
        )}

        {canCancel && (
          <Button
            variant="clay"
            label="Annuler la commande"
            onPress={handleCancel}
            loading={cancelOrder.isPending}
          />
        )}
      </ScrollView>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
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
    paddingBottom: spacing['2xl'],
    gap: spacing.md,
  },
  centered: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  priceBlock: {
    borderRadius: radius.lg,
    padding: 18,
    backgroundColor: colors.navy,
  },
  priceLabel: {
    color: 'rgba(255,255,255,0.42)',
    fontSize: 10,
    letterSpacing: 1,
    fontFamily: 'DMSans_700Bold',
    marginBottom: 4,
  },
  priceValue: {
    color: colors.white,
    fontFamily: 'Fraunces_700Bold',
    fontSize: 28,
  },
  priceNote: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 11,
    fontFamily: 'DMSans_500Medium',
    marginTop: 2,
  },
  sectionCard: {
    padding: 16,
  },
  sectionLabel: {
    ...textStyles.label,
    color: colors.textMuted,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 8,
  },
  rowLabel: {
    color: colors.textSec,
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
  },
  rowValue: {
    color: colors.navy,
    fontSize: 13,
    fontFamily: 'DMSans_600SemiBold',
    maxWidth: 210,
    textAlign: 'right',
  },
  locationText: {
    color: colors.textPrimary,
    ...textStyles.body,
  },
  timelineRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: radius.full,
    marginTop: 6,
  },
  timelineTitle: {
    color: colors.textPrimary,
    ...textStyles.body,
  },
  timelineDate: {
    color: colors.textMuted,
    fontSize: 11,
    fontFamily: 'DMSans_400Regular',
  },
  timelineReason: {
    color: colors.textSec,
    ...textStyles.body,
    fontStyle: 'italic',
    marginTop: 2,
  },
  starRow: {
    flexDirection: 'row',
    gap: 4,
  },
  ratingComment: {
    marginTop: spacing.sm,
    color: colors.textSec,
    ...textStyles.body,
    fontStyle: 'italic',
  },
});
