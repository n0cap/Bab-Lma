import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { OrdersStackParamList } from '../../navigation/OrdersStack';
import { useOrder } from '../../services/queries/orders';
import { useCancelOrder } from '../../services/mutations/orders';
import { colors, textStyles, spacing } from '../../theme';

type Route = RouteProp<OrdersStackParamList, 'OrderDetail'>;

const SERVICE_LABELS: Record<string, string> = {
  menage: 'Ménage',
  cuisine: 'Cuisine',
  childcare: 'Garde d\'enfants',
};

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: 'Brouillon', color: colors.textMuted, bg: colors.bgAlt },
  submitted: { label: 'Soumise', color: colors.navy, bg: colors.bg },
  searching: { label: 'Recherche', color: colors.warning, bg: colors.warningBg },
  negotiating: { label: 'Négociation', color: colors.warning, bg: colors.warningBg },
  accepted: { label: 'Acceptée', color: colors.success, bg: colors.successBg },
  en_route: { label: 'En route', color: colors.proA, bg: '#EEEEFF' },
  in_progress: { label: 'En cours', color: colors.proA, bg: '#EEEEFF' },
  completed: { label: 'Terminée', color: colors.success, bg: colors.successBg },
  cancelled: { label: 'Annulée', color: colors.error, bg: '#FCEAEA' },
};

// Statuses that can be cancelled (non-terminal, before in_progress)
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
  const nav = useNavigation();
  const route = useRoute<Route>();
  const { orderId } = route.params;
  const { data: order, isLoading, refetch } = useOrder(orderId);
  const cancelOrder = useCancelOrder();

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
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <TouchableOpacity onPress={() => nav.goBack()} style={styles.back}>
        <Text style={[textStyles.body, { color: colors.navy }]}>← Retour</Text>
      </TouchableOpacity>

      {/* Header */}
      <View style={styles.header}>
        <Text style={[textStyles.h1, { color: colors.navy }]}>
          {SERVICE_LABELS[order.serviceType] ?? order.serviceType}
        </Text>
        <View style={[styles.badge, { backgroundColor: statusInfo.bg }]}>
          <Text style={[styles.badgeText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
        </View>
      </View>

      {/* Price */}
      <View style={styles.priceBox}>
        <Text style={[textStyles.h3, { color: colors.navy }]}>Prix plancher</Text>
        <Text style={[textStyles.h2, { color: colors.clay, marginTop: 4 }]}>
          {order.floorPrice} MAD
        </Text>
      </View>

      {/* Details */}
      {order.detail && (
        <View style={styles.section}>
          <Text style={[textStyles.h3, { color: colors.navy, marginBottom: spacing.sm }]}>Détails</Text>
          {order.detail.surface != null && (
            <DetailRow label="Surface" value={`${order.detail.surface} m²`} />
          )}
          {order.detail.cleanType && (
            <DetailRow label="Nettoyage" value={order.detail.cleanType === 'deep' ? 'En profondeur' : 'Simple'} />
          )}
          {order.detail.teamType && (
            <DetailRow label="Équipe" value={order.detail.teamType === 'solo' ? 'Solo' : order.detail.teamType === 'duo' ? 'Duo' : 'Équipe'} />
          )}
          {order.detail.guests != null && (
            <DetailRow label="Convives" value={`${order.detail.guests}`} />
          )}
          {order.detail.children != null && (
            <DetailRow label="Enfants" value={`${order.detail.children}`} />
          )}
          {order.detail.hours != null && (
            <DetailRow label="Durée" value={`${order.detail.hours}h`} />
          )}
        </View>
      )}

      {/* Location */}
      <View style={styles.section}>
        <Text style={[textStyles.h3, { color: colors.navy, marginBottom: spacing.sm }]}>Localisation</Text>
        <Text style={[textStyles.body, { color: colors.textPrimary }]}>{order.location}</Text>
      </View>

      {/* Status Timeline */}
      {order.statusEvents && order.statusEvents.length > 0 && (
        <View style={styles.section}>
          <Text style={[textStyles.h3, { color: colors.navy, marginBottom: spacing.sm }]}>Historique</Text>
          {order.statusEvents.map((evt: StatusEvent) => {
            const toInfo = STATUS_LABELS[evt.toStatus] ?? STATUS_LABELS.draft;
            const date = new Date(evt.createdAt).toLocaleString('fr-FR', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            });
            return (
              <View key={evt.id} style={styles.timelineItem}>
                <View style={[styles.dot, { backgroundColor: toInfo.color }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[textStyles.body, { color: colors.textPrimary }]}>
                    {toInfo.label}
                  </Text>
                  <Text style={[textStyles.body, { color: colors.textMuted, fontSize: 11 }]}>
                    {date}
                  </Text>
                  {evt.reason && (
                    <Text style={[textStyles.body, { color: colors.textSec, fontStyle: 'italic', marginTop: 2 }]}>
                      {evt.reason}
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Cancel button */}
      {canCancel && (
        <TouchableOpacity
          style={[styles.cancelBtn, cancelOrder.isPending && styles.btnDisabled]}
          onPress={handleCancel}
          disabled={cancelOrder.isPending}
        >
          {cancelOrder.isPending ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.cancelBtnText}>Annuler la commande</Text>
          )}
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={detailStyles.row}>
      <Text style={detailStyles.label}>{label}</Text>
      <Text style={detailStyles.value}>{value}</Text>
    </View>
  );
}

const detailStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
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
  centered: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  back: { marginBottom: spacing.xl },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  badgeText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 12,
  },
  priceBox: {
    backgroundColor: colors.clayTint,
    borderRadius: 14,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 5,
  },
  cancelBtn: {
    backgroundColor: colors.error,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  btnDisabled: { opacity: 0.6 },
  cancelBtnText: {
    color: colors.white,
    fontFamily: 'DMSans_700Bold',
    fontSize: 15,
  },
});
