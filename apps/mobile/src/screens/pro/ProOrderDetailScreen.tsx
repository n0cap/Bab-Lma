import React, { useMemo } from 'react';
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
import { BackHeader, Button, Card, Chip } from '../../components';
import type { ProStackParamList } from '../../navigation/ProStack';
import { useUpdateOrderStatus } from '../../services/mutations/pro';
import { useProOrders } from '../../services/queries/pro';
import { colors, spacing, textStyles } from '../../theme';

type Nav = NativeStackNavigationProp<ProStackParamList, 'ProOrderDetail'>;
type Route = RouteProp<ProStackParamList, 'ProOrderDetail'>;

const SERVICE_LABELS: Record<string, string> = {
  menage: 'Ménage',
  cuisine: 'Cuisine',
  childcare: 'Garde d\'enfants',
};

const STATUS_META: Record<string, { label: string; variant: 'default' | 'navy' | 'success' | 'clay' | 'warning' }> = {
  draft: { label: 'Brouillon', variant: 'default' },
  submitted: { label: 'Soumise', variant: 'default' },
  searching: { label: 'Recherche', variant: 'warning' },
  negotiating: { label: 'Négociation', variant: 'warning' },
  accepted: { label: 'Acceptée', variant: 'success' },
  en_route: { label: 'En route', variant: 'navy' },
  in_progress: { label: 'En cours', variant: 'navy' },
  completed: { label: 'Terminée', variant: 'success' },
  cancelled: { label: 'Annulée', variant: 'clay' },
};

export function ProOrderDetailScreen() {
  const nav = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { orderId } = route.params;
  const updateStatus = useUpdateOrderStatus();
  const { data, isLoading, refetch } = useProOrders();

  React.useEffect(() => {
    nav.getParent()?.setOptions({ tabBarStyle: { display: 'none' } });
    return () => {
      nav.getParent()?.setOptions({
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
      });
    };
  }, [nav]);

  const order = useMemo(
    () => data?.pages.flatMap((page) => page.data).find((item) => item.id === orderId),
    [data, orderId],
  );

  const setStatus = (toStatus: string, reason?: string) => {
    updateStatus.mutate(
      { orderId, toStatus, reason },
      {
        onSuccess: () => refetch(),
        onError: (err: any) => {
          Alert.alert('Erreur', err?.response?.data?.error?.message ?? 'Action impossible.');
        },
      },
    );
  };

  if (isLoading || !order) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.navy} />
      </View>
    );
  }

  const status = STATUS_META[order.status] ?? STATUS_META.draft;
  const serviceLabel = SERVICE_LABELS[order.serviceType] ?? order.serviceType;

  return (
    <View style={styles.flex}>
      <BackHeader
        title={serviceLabel}
        onBack={() => nav.goBack()}
        right={<Chip label={status.label} variant={status.variant} />}
      />

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>DÉTAILS DE MISSION</Text>
          <DetailRow label="Service" value={serviceLabel} />
          {order.detail?.surface != null && <DetailRow label="Surface" value={`${order.detail.surface} m²`} />}
          {order.detail?.guests != null && <DetailRow label="Convives" value={`${order.detail.guests}`} />}
          {order.detail?.children != null && <DetailRow label="Enfants" value={`${order.detail.children}`} />}
          {order.detail?.hours != null && <DetailRow label="Durée" value={`${order.detail.hours}h`} />}
          <DetailRow label="Adresse" value={order.location} />
          <DetailRow
            label="Prix"
            value={`${order.finalPrice ?? order.floorPrice} MAD`}
          />
        </Card>

        <Card style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>CLIENT</Text>
          <Text style={styles.clientName}>{order.client?.fullName ?? 'Client'}</Text>
          <Text style={styles.clientSub}>Contact via chat sécurisé</Text>
        </Card>

        <Card style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>HISTORIQUE</Text>
          {(order.statusEvents ?? []).map((evt) => {
            const eventMeta = STATUS_META[evt.toStatus] ?? STATUS_META.draft;
            const date = new Date(evt.createdAt).toLocaleString('fr-FR', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <View key={evt.id} style={styles.timelineRow}>
                <View style={styles.timelineDot} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>{eventMeta.label}</Text>
                  <Text style={styles.timelineDate}>{date}</Text>
                  {evt.reason ? <Text style={styles.timelineReason}>{evt.reason}</Text> : null}
                </View>
              </View>
            );
          })}
        </Card>

        {order.assignmentStatus === 'assigned' && (
          <>
            <Button
              variant="primary"
              label="Accepter la mission"
              onPress={() => setStatus('en_route')}
              loading={updateStatus.isPending}
            />
            <Button
              variant="outline"
              label="Décliner"
              onPress={() => setStatus('cancelled', 'Mission déclinée par le professionnel')}
              disabled={updateStatus.isPending}
            />
          </>
        )}

        {order.status === 'negotiating' && (
          <Button
            variant="primary"
            label="Ouvrir le chat"
            onPress={() => nav.navigate('Chat', { orderId })}
          />
        )}

        {order.status === 'accepted' && (
          <Button
            variant="primary"
            label="Je suis en route"
            onPress={() => setStatus('en_route')}
            loading={updateStatus.isPending}
          />
        )}

        {order.status === 'en_route' && (
          <Button
            variant="primary"
            label="Je suis arrivé(e)"
            onPress={() => setStatus('in_progress')}
            loading={updateStatus.isPending}
          />
        )}

        {order.status === 'in_progress' && (
          <Button
            variant="primary"
            label="Terminer la prestation"
            onPress={() => setStatus('completed')}
            loading={updateStatus.isPending}
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
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  rowLabel: {
    color: colors.textSec,
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
  },
  rowValue: {
    color: colors.navy,
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 13,
    textAlign: 'right',
    flexShrink: 1,
  },
  clientName: {
    color: colors.navy,
    fontFamily: 'DMSans_700Bold',
    fontSize: 14,
  },
  clientSub: {
    color: colors.textMuted,
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
    marginTop: 2,
  },
  timelineRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: colors.navy,
    marginTop: 6,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    color: colors.textPrimary,
    ...textStyles.body,
  },
  timelineDate: {
    color: colors.textMuted,
    fontFamily: 'DMSans_400Regular',
    fontSize: 11,
  },
  timelineReason: {
    color: colors.textSec,
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 2,
  },
});
