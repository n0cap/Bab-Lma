import React, { useMemo, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { OrdersStackParamList } from '../../navigation/OrdersStack';
import { useOrders } from '../../services/queries/orders';
import { colors, textStyles, spacing } from '../../theme';

type Nav = NativeStackNavigationProp<OrdersStackParamList>;

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

const TERMINAL_STATUSES = new Set(['completed', 'cancelled']);

interface OrderItem {
  id: string;
  serviceType: string;
  status: string;
  floorPrice: number;
  finalPrice?: number | null;
  createdAt: string;
}

type Tab = 'active' | 'history';

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

  const renderItem = ({ item }: { item: OrderItem }) => {
    const status = STATUS_LABELS[item.status] ?? STATUS_LABELS.draft;
    const date = new Date(item.createdAt).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
    });

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => nav.navigate('OrderDetail', { orderId: item.id })}
        accessibilityRole="button"
        accessibilityLabel={`Commande ${SERVICE_LABELS[item.serviceType] ?? item.serviceType}, ${status.label}, ${item.finalPrice != null ? item.finalPrice : item.floorPrice} MAD`}
      >
        <View style={styles.cardHeader}>
          <Text style={[textStyles.h2, { color: colors.navy }]}>
            {SERVICE_LABELS[item.serviceType] ?? item.serviceType}
          </Text>
          <View style={[styles.badge, { backgroundColor: status.bg }]}>
            <Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>
        <View style={styles.cardFooter}>
          {item.finalPrice != null ? (
            <Text style={[textStyles.body, { color: colors.success, fontFamily: 'DMSans_600SemiBold' }]}>
              {item.finalPrice} MAD
            </Text>
          ) : (
            <Text style={[textStyles.body, { color: colors.clay }]}>
              {item.floorPrice} MAD
            </Text>
          )}
          <Text style={[textStyles.body, { color: colors.textMuted }]}>{date}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.navy} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text
        style={[textStyles.h1, { color: colors.navy, marginBottom: spacing.md, paddingHorizontal: spacing.lg }]}
        accessibilityRole="header"
      >
        Commandes
      </Text>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'active' && styles.tabActive]}
          onPress={() => setActiveTab('active')}
          accessibilityRole="tab"
          accessibilityLabel="En cours"
          accessibilityState={{ selected: activeTab === 'active' }}
        >
          <Text style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}>
            En cours
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.tabActive]}
          onPress={() => setActiveTab('history')}
          accessibilityRole="tab"
          accessibilityLabel="Historique"
          accessibilityState={{ selected: activeTab === 'history' }}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
            Historique
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 40 }}
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
            <Text style={[textStyles.body, { color: colors.textMuted, textAlign: 'center' }]}>
              {activeTab === 'active'
                ? 'Aucune commande en cours.'
                : 'Aucune commande terminée.'}
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
    paddingTop: 80,
  },
  centered: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  tab: {
    paddingBottom: spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    minHeight: 48,
  },
  tabActive: {
    borderBottomColor: colors.navy,
  },
  tabText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 14,
    color: colors.textMuted,
  },
  tabTextActive: {
    color: colors.navy,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 11,
  },
  empty: {
    paddingTop: 60,
    alignItems: 'center',
  },
});
