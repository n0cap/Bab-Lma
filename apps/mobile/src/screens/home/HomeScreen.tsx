import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { HomeStackParamList } from '../../navigation/HomeStack';
import type { MainTabsParamList } from '../../navigation/MainTabs';
import { useOrders } from '../../services/queries/orders';
import { colors, textStyles, spacing } from '../../theme';

// Composite nav: HomeStack inside MainTabs — allows cross-tab navigation
type Nav = CompositeNavigationProp<
  NativeStackNavigationProp<HomeStackParamList>,
  BottomTabNavigationProp<MainTabsParamList>
>;

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
};

const TERMINAL = new Set(['completed', 'cancelled']);

export function HomeScreen() {
  const nav = useNavigation<Nav>();
  const { data } = useOrders();

  // First 3 non-terminal orders
  const recentOrders = useMemo(() => {
    if (!data?.pages) return [];
    const all = data.pages.flatMap((page) => page.data ?? []);
    return all.filter((o: any) => !TERMINAL.has(o.status)).slice(0, 3);
  }, [data]);

  const handleOrderTap = (orderId: string) => {
    // Navigate to Orders tab → OrderDetail (clean cross-tab navigation)
    nav.navigate('OrdersTab', { screen: 'OrderDetail', params: { orderId } });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={[textStyles.display, { color: colors.navy }]}>Babloo</Text>
      <Text style={[textStyles.body, { color: colors.textSec, marginTop: spacing.sm }]}>
        Vos services à domicile
      </Text>

      <TouchableOpacity
        style={styles.bookBtn}
        onPress={() => nav.navigate('ServiceSelection')}
        accessibilityRole="button"
        accessibilityLabel="Réserver un service"
      >
        <Text style={styles.bookBtnText}>Réserver un service</Text>
      </TouchableOpacity>

      {/* Recent orders */}
      {recentOrders.length > 0 && (
        <View style={styles.recentSection}>
          <Text
            style={[textStyles.h3, { color: colors.navy, marginBottom: spacing.sm }]}
            accessibilityRole="header"
          >
            Commandes récentes
          </Text>
          {recentOrders.map((order: any) => {
            const status = STATUS_LABELS[order.status] ?? STATUS_LABELS.draft;
            const date = new Date(order.createdAt).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'short',
            });
            return (
              <TouchableOpacity
                key={order.id}
                style={styles.recentCard}
                onPress={() => handleOrderTap(order.id)}
                accessibilityRole="button"
                accessibilityLabel={`${SERVICE_LABELS[order.serviceType] ?? order.serviceType}, ${status.label}`}
              >
                <View style={styles.recentCardHeader}>
                  <Text style={[textStyles.body, { color: colors.navy, fontFamily: 'DMSans_600SemiBold' }]}>
                    {SERVICE_LABELS[order.serviceType] ?? order.serviceType}
                  </Text>
                  <View style={[styles.badge, { backgroundColor: status.bg }]}>
                    <Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text>
                  </View>
                </View>
                <Text style={[textStyles.body, { color: colors.textMuted, fontSize: 12 }]}>{date}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Service quick cards */}
      <View style={styles.grid}>
        {[
          { key: 'menage' as const, label: 'Ménage', desc: 'Nettoyage' },
          { key: 'cuisine' as const, label: 'Cuisine', desc: 'Repas' },
          { key: 'childcare' as const, label: 'Garde', desc: 'Enfants' },
        ].map((svc) => (
          <TouchableOpacity
            key={svc.key}
            style={styles.quickCard}
            onPress={() => nav.navigate('ServiceDetail', { serviceType: svc.key })}
            accessibilityRole="button"
            accessibilityLabel={`${svc.label} — ${svc.desc}`}
          >
            <Text style={[textStyles.h3, { color: colors.navy }]}>{svc.label}</Text>
            <Text style={[textStyles.body, { color: colors.textMuted, marginTop: 2 }]}>{svc.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.lg,
    paddingTop: 80,
  },
  bookBtn: {
    backgroundColor: colors.navy,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
  },
  bookBtnText: {
    color: colors.white,
    fontFamily: 'DMSans_700Bold',
    fontSize: 16,
  },
  recentSection: {
    marginBottom: spacing.xl,
  },
  recentCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  recentCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 10,
  },
  grid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  quickCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.md,
    alignItems: 'center',
  },
});
