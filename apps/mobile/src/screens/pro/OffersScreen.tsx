import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button, Card, Chip } from '../../components';
import type { OffersStackParamList } from '../../navigation/OffersStack';
import { useJoinRequest } from '../../services/mutations/proJoinRequest';
import { useProOpenSlots } from '../../services/queries/proOpenSlots';
import { useProOrders, type ProOrder } from '../../services/queries/pro';
import { colors, radius, spacing, textStyles } from '../../theme';

type Nav = NativeStackNavigationProp<OffersStackParamList, 'Offers'>;
type AmountFilter = 'low' | 'medium' | 'high';
type SurfaceFilter = 'small' | 'medium' | 'large';
type TeamFilter = 'solo' | 'duo' | 'squad';
type RatingFilter = '3plus' | '4plus';
type OffersView = 'list' | 'map';
type ListTab = 'offers' | 'teams';

type FilterSets = {
  amount: Set<AmountFilter>;
  surface: Set<SurfaceFilter>;
  team: Set<TeamFilter>;
  rating: Set<RatingFilter>;
};

const SERVICE_LABELS: Record<string, string> = {
  menage: 'Ménage',
  cuisine: 'Cuisine',
  childcare: 'Garde d\'enfants',
};

const TEAM_LABELS: Record<string, string> = {
  solo: 'Solo',
  duo: 'Duo',
  squad: 'Squad',
};

function passesAmount(order: ProOrder, selected: Set<AmountFilter>) {
  if (selected.size === 0) return true;
  const amount = order.floorPrice;
  return (
    (selected.has('low') && amount < 200) ||
    (selected.has('medium') && amount >= 200 && amount <= 400) ||
    (selected.has('high') && amount > 400)
  );
}

function passesSurface(order: ProOrder, selected: Set<SurfaceFilter>) {
  if (selected.size === 0) return true;
  const surface = order.detail?.surface;
  if (surface == null) return true;
  return (
    (selected.has('small') && surface < 60) ||
    (selected.has('medium') && surface >= 60 && surface <= 120) ||
    (selected.has('large') && surface > 120)
  );
}

function passesTeam(order: ProOrder, selected: Set<TeamFilter>) {
  if (selected.size === 0) return true;
  const team = order.detail?.teamType?.toLowerCase();
  if (!team) return true;
  return selected.has(team as TeamFilter);
}

function passesRating(order: ProOrder, selected: Set<RatingFilter>) {
  if (selected.size === 0) return true;
  const rating = (order.client as { rating?: number } | null | undefined)?.rating;
  if (rating == null) return true;
  return (selected.has('4plus') && rating >= 4) || (selected.has('3plus') && rating >= 3);
}

function toggleSetValue<T extends string>(set: Set<T>, value: T) {
  const next = new Set(set);
  if (next.has(value)) {
    next.delete(value);
  } else {
    next.add(value);
  }
  return next;
}

export function OffersScreen() {
  const nav = useNavigation<Nav>();
  const [view, setView] = useState<OffersView>('list');
  const [listTab, setListTab] = useState<ListTab>('offers');
  const [filters, setFilters] = useState<FilterSets>({
    amount: new Set<AmountFilter>(),
    surface: new Set<SurfaceFilter>(),
    team: new Set<TeamFilter>(),
    rating: new Set<RatingFilter>(),
  });
  const joinRequest = useJoinRequest();

  const {
    data,
    isLoading,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useProOrders();

  const {
    data: teamSlots = [],
    isLoading: isLoadingTeamSlots,
    isRefetching: isRefetchingTeamSlots,
    refetch: refetchTeamSlots,
  } = useProOpenSlots();

  const offers = useMemo(
    () => (data?.pages.flatMap((page) => page.data) ?? []).filter(
      (order) => order.status === 'negotiating' && order.assignmentStatus === 'assigned',
    ),
    [data],
  );

  const filteredOffers = useMemo(
    () => offers.filter((order) => (
      passesAmount(order, filters.amount)
      && passesSurface(order, filters.surface)
      && passesTeam(order, filters.team)
      && passesRating(order, filters.rating)
    )),
    [offers, filters],
  );

  if (isLoading || isLoadingTeamSlots) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.navy} />
      </View>
    );
  }

  const refreshAll = () => {
    refetch();
    refetchTeamSlots();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Offres disponibles</Text>
        <Text style={styles.subtitle}>Filtrez les missions qui vous conviennent.</Text>
      </View>

      <View style={styles.toggleRow}>
        <Pressable
          onPress={() => setView('list')}
          style={[styles.toggleBtn, view === 'list' && styles.toggleBtnActive]}
          accessibilityRole="button"
          accessibilityLabel="Liste"
        >
          <Text style={[styles.toggleText, view === 'list' && styles.toggleTextActive]}>Liste</Text>
        </Pressable>
        <Pressable
          onPress={() => setView('map')}
          style={[styles.toggleBtn, view === 'map' && styles.toggleBtnActive]}
          accessibilityRole="button"
          accessibilityLabel="Carte"
        >
          <Text style={[styles.toggleText, view === 'map' && styles.toggleTextActive]}>Carte</Text>
        </Pressable>
      </View>

      {view === 'list' ? (
        <>
          <View style={styles.subToggleRow}>
            <Pressable
              onPress={() => setListTab('offers')}
              style={[styles.subToggleBtn, listTab === 'offers' && styles.subToggleBtnActive]}
              accessibilityRole="button"
              accessibilityLabel="Offres"
            >
              <Text style={[styles.subToggleText, listTab === 'offers' && styles.subToggleTextActive]}>Offres</Text>
            </Pressable>
            <Pressable
              onPress={() => setListTab('teams')}
              style={[styles.subToggleBtn, listTab === 'teams' && styles.subToggleBtnActive]}
              accessibilityRole="button"
              accessibilityLabel="Équipes"
            >
              <Text style={[styles.subToggleText, listTab === 'teams' && styles.subToggleTextActive]}>Équipes</Text>
            </Pressable>
          </View>

          {listTab === 'offers' ? (
            <>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filtersRow}
              >
                <FilterChip
                  label="Prix <200"
                  active={filters.amount.has('low')}
                  onPress={() => setFilters((prev) => ({ ...prev, amount: toggleSetValue(prev.amount, 'low') }))}
                />
                <FilterChip
                  label="Prix 200-400"
                  active={filters.amount.has('medium')}
                  onPress={() => setFilters((prev) => ({ ...prev, amount: toggleSetValue(prev.amount, 'medium') }))}
                />
                <FilterChip
                  label="Prix 400+"
                  active={filters.amount.has('high')}
                  onPress={() => setFilters((prev) => ({ ...prev, amount: toggleSetValue(prev.amount, 'high') }))}
                />
                <FilterChip
                  label="<60m²"
                  active={filters.surface.has('small')}
                  onPress={() => setFilters((prev) => ({ ...prev, surface: toggleSetValue(prev.surface, 'small') }))}
                />
                <FilterChip
                  label="60-120m²"
                  active={filters.surface.has('medium')}
                  onPress={() => setFilters((prev) => ({ ...prev, surface: toggleSetValue(prev.surface, 'medium') }))}
                />
                <FilterChip
                  label="120m²+"
                  active={filters.surface.has('large')}
                  onPress={() => setFilters((prev) => ({ ...prev, surface: toggleSetValue(prev.surface, 'large') }))}
                />
                <FilterChip
                  label="Solo"
                  active={filters.team.has('solo')}
                  onPress={() => setFilters((prev) => ({ ...prev, team: toggleSetValue(prev.team, 'solo') }))}
                />
                <FilterChip
                  label="Duo"
                  active={filters.team.has('duo')}
                  onPress={() => setFilters((prev) => ({ ...prev, team: toggleSetValue(prev.team, 'duo') }))}
                />
                <FilterChip
                  label="Squad"
                  active={filters.team.has('squad')}
                  onPress={() => setFilters((prev) => ({ ...prev, team: toggleSetValue(prev.team, 'squad') }))}
                />
                <FilterChip
                  label="Client 4+"
                  active={filters.rating.has('4plus')}
                  onPress={() => setFilters((prev) => ({ ...prev, rating: toggleSetValue(prev.rating, '4plus') }))}
                />
                <FilterChip
                  label="Client 3+"
                  active={filters.rating.has('3plus')}
                  onPress={() => setFilters((prev) => ({ ...prev, rating: toggleSetValue(prev.rating, '3plus') }))}
                />
              </ScrollView>

              <FlatList
                data={filteredOffers}
                keyExtractor={(item) => item.assignmentId}
                contentContainerStyle={styles.listContent}
                refreshControl={
                  <RefreshControl
                    refreshing={isRefetching || isRefetchingTeamSlots}
                    onRefresh={refreshAll}
                    tintColor={colors.navy}
                  />
                }
                onEndReached={() => {
                  if (hasNextPage && !isFetchingNextPage) fetchNextPage();
                }}
                onEndReachedThreshold={0.4}
                ListEmptyComponent={<Text style={styles.emptyText}>Aucune offre avec ces filtres.</Text>}
                ListFooterComponent={isFetchingNextPage ? <ActivityIndicator color={colors.navy} /> : null}
                renderItem={({ item }) => {
                  const serviceLabel = SERVICE_LABELS[item.serviceType] ?? item.serviceType;
                  const surfaceText = item.detail?.surface != null ? `${item.detail.surface} m²` : 'Surface non précisée';
                  const team = item.detail?.teamType?.toLowerCase();
                  const teamText = team ? (TEAM_LABELS[team] ?? item.detail?.teamType ?? 'Équipe flexible') : 'Équipe flexible';
                  const rating = (item.client as { rating?: number } | null | undefined)?.rating;

                  return (
                    <Card style={styles.offerCard}>
                      <View style={styles.cardTop}>
                        <Text style={styles.serviceLabel}>{serviceLabel}</Text>
                        <Chip label="Négociation" variant="warning" />
                      </View>

                      <Text style={styles.location}>{item.location}</Text>
                      <Text style={styles.price}>{item.floorPrice} MAD</Text>
                      <Text style={styles.meta}>{surfaceText} • {teamText}</Text>
                      {rating != null ? <Text style={styles.meta}>Client: {rating.toFixed(1)} ★</Text> : null}

                      <View style={styles.actions}>
                        <Button
                          variant="primary"
                          label="Accepter"
                          onPress={() => nav.navigate('Chat', { orderId: item.id })}
                        />
                        <Pressable
                          onPress={() => nav.navigate('ProOrderDetail', { orderId: item.id })}
                          accessibilityRole="button"
                          accessibilityLabel="Voir détails"
                        >
                          <Text style={styles.detailsLink}>Voir détails</Text>
                        </Pressable>
                      </View>
                    </Card>
                  );
                }}
              />
            </>
          ) : (
            <FlatList
              data={teamSlots}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl
                  refreshing={isRefetchingTeamSlots}
                  onRefresh={refetchTeamSlots}
                  tintColor={colors.navy}
                />
              }
              ListEmptyComponent={<Text style={styles.emptyText}>Aucune équipe ouverte pour le moment.</Text>}
              renderItem={({ item }) => {
                const serviceLabel = SERVICE_LABELS[item.serviceType] ?? item.serviceType;
                const teamType = item.detail?.teamType?.toLowerCase();
                const teamLabel = teamType ? (TEAM_LABELS[teamType] ?? item.detail?.teamType ?? 'Équipe') : 'Équipe';

                return (
                  <Card style={styles.offerCard}>
                    <View style={styles.cardTop}>
                      <Text style={styles.serviceLabel}>{serviceLabel}</Text>
                      <Chip label="Équipe" variant="navy" />
                    </View>

                    <Text style={styles.location}>{item.location}</Text>
                    <Text style={styles.price}>{item.finalPrice ?? item.floorPrice} MAD</Text>
                    <Text style={styles.meta}>{teamLabel} • {item.filledSlots}/{item.totalSlots} membres</Text>
                    <Text style={styles.meta}>Client: {item.client?.fullName ?? 'Client'}</Text>

                    <Button
                      variant="primary"
                      label="Rejoindre"
                      onPress={() =>
                        joinRequest.mutate(
                          { orderId: item.id },
                          {
                            onSuccess: () => {
                              Alert.alert('Demande envoyée', 'Votre demande a été envoyée au chef d\'équipe.');
                            },
                            onError: (err: any) => {
                              Alert.alert('Erreur', err?.response?.data?.error?.message ?? 'Action impossible.');
                            },
                          },
                        )
                      }
                      loading={joinRequest.isPending}
                    />
                  </Card>
                );
              }}
            />
          )}
        </>
      ) : (
        <View style={styles.comingSoonWrap}>
          <Text style={styles.comingSoonIcon}>🗺️</Text>
          <Text style={styles.comingSoonTitle}>Carte des offres</Text>
          <Text style={styles.comingSoonSubtitle}>
            Bientôt, visualisez les offres sur une carte avec leur localisation approximative.
          </Text>
        </View>
      )}
    </View>
  );
}

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
      <Chip label={label} variant={active ? 'navy' : 'default'} style={styles.filterChip} />
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
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  title: {
    ...textStyles.h1,
    color: colors.navy,
  },
  subtitle: {
    color: colors.textMuted,
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
    marginTop: 2,
  },
  toggleRow: {
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: colors.bgAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    padding: 4,
    marginBottom: spacing.xs,
    gap: spacing.xs,
  },
  toggleBtn: {
    borderRadius: radius.full,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  toggleBtnActive: {
    backgroundColor: colors.navy,
  },
  toggleText: {
    color: colors.textSec,
    fontFamily: 'DMSans_700Bold',
    fontSize: 13,
  },
  toggleTextActive: {
    color: colors.white,
  },
  subToggleRow: {
    flexDirection: 'row',
    alignSelf: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  subToggleBtn: {
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
  },
  subToggleBtnActive: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  subToggleText: {
    color: colors.textSec,
    fontFamily: 'DMSans_700Bold',
    fontSize: 12,
  },
  subToggleTextActive: {
    color: colors.white,
  },
  filtersRow: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  filterChip: {
    borderRadius: radius.full,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['2xl'],
    gap: spacing.md,
  },
  offerCard: {
    padding: 16,
    gap: spacing.sm,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceLabel: {
    color: colors.navy,
    fontFamily: 'DMSans_700Bold',
    fontSize: 14,
  },
  location: {
    color: colors.textSec,
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
  },
  price: {
    color: colors.navy,
    fontFamily: 'Fraunces_700Bold',
    fontSize: 22,
  },
  meta: {
    color: colors.textMuted,
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
  },
  actions: {
    marginTop: spacing.xs,
    gap: spacing.sm,
  },
  detailsLink: {
    color: colors.navy,
    fontFamily: 'DMSans_700Bold',
    fontSize: 13,
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textMuted,
    fontFamily: 'DMSans_500Medium',
    marginTop: spacing['2xl'],
  },
  comingSoonWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  comingSoonIcon: {
    fontSize: 42,
  },
  comingSoonTitle: {
    color: colors.navy,
    fontFamily: 'DMSans_700Bold',
    fontSize: 20,
    textAlign: 'center',
  },
  comingSoonSubtitle: {
    color: colors.textMuted,
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 320,
  },
});
