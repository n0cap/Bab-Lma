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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar, Card, Chip, Toggle } from '../../components';
import { StarIcon } from '../../components';
import { useAuth } from '../../contexts/AuthContext';
import type { ProStackParamList } from '../../navigation/ProStack';
import { useProOrders, type ProOrder } from '../../services/queries/pro';
import { colors, radius, spacing, textStyles } from '../../theme';

type ProTab = 'pending' | 'active' | 'done';
type Nav = NativeStackNavigationProp<ProStackParamList, 'ProHome'>;

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

function getInitials(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'PR';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function matchesTab(order: ProOrder, tab: ProTab) {
  if (tab === 'pending') {
    return order.assignmentStatus === 'assigned' || ['searching', 'negotiating'].includes(order.status);
  }

  if (tab === 'active') {
    return ['accepted', 'en_route', 'in_progress'].includes(order.status);
  }

  return order.assignmentStatus === 'declined' || ['completed', 'cancelled'].includes(order.status);
}

export function ProHomeScreen() {
  const nav = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [isAvailable, setIsAvailable] = useState(true);
  const [activeTab, setActiveTab] = useState<ProTab>('pending');

  const {
    data,
    isLoading,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useProOrders();

  const allOrders = useMemo(() => data?.pages.flatMap((page) => page.data) ?? [], [data]);
  const filteredOrders = useMemo(
    () => allOrders.filter((order) => matchesTab(order, activeTab)),
    [allOrders, activeTab],
  );

  const firstName = user?.fullName?.split(' ')[0] ?? 'Pro';
  const initials = getInitials(user?.fullName ?? 'Pro');

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.navy} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top + 8, 52) }]}>
        <View style={styles.headerRow}>
          <View style={styles.profileRow}>
            <Avatar initials={initials} size="md" variant="user" />
            <View>
              <Text style={styles.greeting}>Bonjour, {firstName}</Text>
              <Text style={styles.subGreeting}>Vos missions du jour</Text>
            </View>
          </View>
          <View style={styles.toggleWrap}>
            <Text style={styles.toggleLabel}>{isAvailable ? 'Disponible' : 'Hors ligne'}</Text>
            <Toggle value={isAvailable} onToggle={() => setIsAvailable((v) => !v)} />
          </View>
        </View>

        <Card style={styles.statsCard}>
          <View style={styles.statsRow}>
            <StatCol
              label="Rating"
              value={(
                <View style={styles.ratingValue}>
                  <StarIcon size={14} color={colors.navy} />
                  <Text style={styles.statValue}>4.8</Text>
                </View>
              )}
            />
            <StatCol label="Sessions" value="127" />
            <StatCol label="Fiabilité" value="97%" />
          </View>
        </Card>
      </View>

      <View style={styles.tabBar}>
        <TabButton
          label="En attente"
          isActive={activeTab === 'pending'}
          onPress={() => setActiveTab('pending')}
        />
        <TabButton
          label="En cours"
          isActive={activeTab === 'active'}
          onPress={() => setActiveTab('active')}
        />
        <TabButton
          label="Terminées"
          isActive={activeTab === 'done'}
          onPress={() => setActiveTab('done')}
        />
      </View>

      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.assignmentId}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.navy} />
        }
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={<Text style={styles.emptyText}>Aucune mission dans cette section.</Text>}
        ListFooterComponent={isFetchingNextPage ? <ActivityIndicator color={colors.navy} /> : null}
        renderItem={({ item }) => {
          const status = STATUS_META[item.status] ?? STATUS_META.draft;
          const serviceLabel = SERVICE_LABELS[item.serviceType] ?? item.serviceType;
          const price = item.finalPrice ?? item.floorPrice;
          const date = new Date(item.createdAt).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          });

          return (
            <Pressable
              onPress={() => nav.navigate('ProOrderDetail', { orderId: item.id })}
              accessibilityRole="button"
              accessibilityLabel={`${serviceLabel}, ${status.label}`}
            >
              <Card style={styles.orderCard}>
                <View style={styles.cardTop}>
                  <Text style={styles.serviceLabel}>{serviceLabel}</Text>
                  <Chip label={status.label} variant={status.variant} />
                </View>

                <Text style={styles.clientName}>{item.client?.fullName ?? 'Client'}</Text>
                <Text style={styles.location}>{item.location}</Text>

                <View style={styles.cardBottom}>
                  <Text style={styles.price}>{price} MAD</Text>
                  <Text style={styles.date}>{date}</Text>
                </View>
              </Card>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

function StatCol({ label, value }: { label: string; value: string | React.ReactNode }) {
  return (
    <View style={styles.statCol}>
      {typeof value === 'string' ? <Text style={styles.statValue}>{value}</Text> : value}
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function TabButton({ label, isActive, onPress }: { label: string; isActive: boolean; onPress: () => void }) {
  return (
    <Pressable
      style={[styles.tabBtn, isActive && styles.tabBtnActive]}
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: isActive }}
      accessibilityLabel={label}
    >
      <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg,
  },
  header: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  greeting: {
    ...textStyles.h1,
    color: colors.navy,
  },
  subGreeting: {
    color: colors.textMuted,
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
  },
  toggleWrap: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  toggleLabel: {
    color: colors.textSec,
    fontSize: 10,
    fontFamily: 'DMSans_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  statsCard: {
    paddingVertical: 14,
    paddingHorizontal: 10,
  },
  statsRow: {
    flexDirection: 'row',
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: colors.navy,
    fontFamily: 'Fraunces_700Bold',
    fontSize: 18,
  },
  ratingValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    color: colors.textMuted,
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 10,
    marginTop: 2,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
    borderRadius: radius.full,
    backgroundColor: colors.bgAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabBtnActive: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  tabText: {
    color: colors.textSec,
    fontFamily: 'DMSans_700Bold',
    fontSize: 12,
  },
  tabTextActive: {
    color: colors.white,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['2xl'],
    gap: spacing.md,
  },
  orderCard: {
    padding: 16,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  serviceLabel: {
    color: colors.navy,
    fontFamily: 'DMSans_700Bold',
    fontSize: 14,
  },
  clientName: {
    color: colors.textPrimary,
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 13,
    marginBottom: 2,
  },
  location: {
    color: colors.textMuted,
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  price: {
    color: colors.navy,
    fontFamily: 'Fraunces_700Bold',
    fontSize: 18,
  },
  date: {
    color: colors.textMuted,
    fontFamily: 'DMSans_500Medium',
    fontSize: 11,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textMuted,
    fontFamily: 'DMSans_500Medium',
    marginTop: spacing['2xl'],
  },
});
