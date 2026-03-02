import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { OrdersStackParamList } from '../../navigation/OrdersStack';
import { useOrders } from '../../services/queries/orders';
import { colors, radius, shadows, spacing, textStyles } from '../../theme';

type Nav = NativeStackNavigationProp<OrdersStackParamList>;
type Tab = 'active' | 'history';

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
  en_route: { label: 'En route', color: colors.proA, bg: colors.bgAlt },
  in_progress: { label: 'En cours', color: colors.proA, bg: colors.bgAlt },
  completed: { label: 'Terminée', color: colors.success, bg: colors.successBg },
  cancelled: { label: 'Annulée', color: colors.error, bg: colors.bgAlt },
};

const TERMINAL_STATUSES = new Set(['completed', 'cancelled']);

interface OrderItem {
  id: string;
  serviceType: string;
  status: string;
  floorPrice: number;
  finalPrice?: number | null;
  createdAt: string;
}

export function OrdersListScreen() {
  const nav = useNavigation<Nav>();
  const [activeTab, setActiveTab] = useState<Tab>('active');
  const {
    data,
    isLoading,
    isRefetching,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useOrders();

  const allOrders = useMemo(
    () => data?.pages.flatMap((page) => page.data) ?? [],
    [data],
  );

  const filteredOrders = useMemo(
    () => allOrders.filter((o: OrderItem) =>
      activeTab === 'active'
        ? !TERMINAL_STATUSES.has(o.status)
        : TERMINAL_STATUSES.has(o.status),
    ),
    [allOrders, activeTab],
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.navy} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle} accessibilityRole="header">Mes commandes</Text>
        <View style={styles.logoMark}><Text style={styles.logoMarkText}>B</Text></View>
      </View>

      <View style={styles.tabBar}>
        <Pressable
          style={[styles.tab, activeTab === 'active' && styles.tabActive]}
          onPress={() => setActiveTab('active')}
          accessibilityRole="tab"
          accessibilityLabel="En cours"
          accessibilityState={{ selected: activeTab === 'active' }}
        >
          <Text style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}>En cours</Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'history' && styles.tabActive]}
          onPress={() => setActiveTab('history')}
          accessibilityRole="tab"
          accessibilityLabel="Historique"
          accessibilityState={{ selected: activeTab === 'history' }}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>Historique</Text>
        </Pressable>
      </View>

      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const status = STATUS_LABELS[item.status] ?? STATUS_LABELS.draft;
          const date = new Date(item.createdAt).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          });

          return (
            <Pressable
              style={styles.card}
              onPress={() => nav.navigate('OrderDetail', { orderId: item.id })}
              accessibilityRole="button"
              accessibilityLabel={`Commande ${SERVICE_LABELS[item.serviceType] ?? item.serviceType}, ${status.label}, ${item.finalPrice != null ? item.finalPrice : item.floorPrice} MAD`}
            >
              <View style={styles.cardTop}>
                <View>
                  <Text style={styles.cardTitle}>{SERVICE_LABELS[item.serviceType] ?? item.serviceType}</Text>
                  <Text style={styles.cardSub}>{date}</Text>
                </View>
                <View style={[styles.statusChip, { backgroundColor: status.bg }]}>
                  <Text style={[styles.statusChipText, { color: status.color }]}>{status.label}</Text>
                </View>
              </View>

              <View style={styles.cardBottom}>
                <Text style={styles.amount}>{item.finalPrice != null ? item.finalPrice : item.floorPrice} MAD</Text>
                <Text style={styles.detailLink}>Voir détail</Text>
              </View>
            </Pressable>
          );
        }}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing['2xl'] }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.navy} />
        }
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={isFetchingNextPage ? <ActivityIndicator color={colors.navy} style={{ marginVertical: spacing.md }} /> : null}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {activeTab === 'active' ? 'Aucune commande en cours.' : 'Aucune commande terminée.'}
            </Text>
          </View>
        }
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  centered: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingTop: 52,
    paddingHorizontal: spacing.lg,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    ...textStyles.h1,
    color: colors.navy,
  },
  logoMark: {
    width: 28,
    height: 28,
    borderRadius: radius.md,
    backgroundColor: colors.bgAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoMarkText: {
    color: colors.clay,
    fontSize: 13,
    fontFamily: 'Fraunces_700Bold',
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingTop: 12,
    paddingBottom: 8,
    gap: spacing.md,
  },
  tab: {
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    paddingBottom: spacing.sm,
    minHeight: 48,
  },
  tabActive: {
    borderBottomColor: colors.navy,
  },
  tabText: {
    fontSize: 14,
    color: colors.textMuted,
    fontFamily: 'DMSans_600SemiBold',
  },
  tabTextActive: {
    color: colors.navy,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadows.sm,
  },
  cardTop: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cardTitle: {
    color: colors.navy,
    fontSize: 14,
    fontFamily: 'DMSans_700Bold',
  },
  cardSub: {
    color: colors.textMuted,
    fontSize: 11,
    fontFamily: 'DMSans_500Medium',
    marginTop: 2,
  },
  statusChip: {
    borderRadius: radius.full,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  statusChipText: {
    fontSize: 10,
    fontFamily: 'DMSans_700Bold',
  },
  cardBottom: {
    backgroundColor: colors.bgAlt,
    paddingVertical: 11,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amount: {
    color: colors.navy,
    fontFamily: 'Fraunces_700Bold',
    fontSize: 16,
  },
  detailLink: {
    color: colors.clay,
    fontSize: 12,
    fontFamily: 'DMSans_600SemiBold',
  },
  empty: {
    paddingTop: 72,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textMuted,
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    textAlign: 'center',
  },
});
