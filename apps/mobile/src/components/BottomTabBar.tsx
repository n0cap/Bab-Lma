import React, { useMemo } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type {
  BottomTabBarProps,
} from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOrders } from '../services/queries/orders';
import { colors, radius, spacing } from '../theme';
import { HomeIcon, LoyaltyIcon, OrdersIcon, SettingsIcon } from './icons';

const TERMINAL = new Set(['completed', 'cancelled']);

function isTabBarVisible(state: BottomTabBarProps['state']): boolean {
  const focusedRoute = state.routes[state.index];
  const nestedRouteName = getFocusedRouteNameFromRoute(focusedRoute);

  if (focusedRoute.name === 'HomeTab') {
    return !nestedRouteName || nestedRouteName === 'Home';
  }

  if (focusedRoute.name === 'OrdersTab') {
    return !nestedRouteName || nestedRouteName === 'OrdersList';
  }

  return true;
}

export function BottomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { data } = useOrders();

  const activeOrdersCount = useMemo(() => {
    if (!data?.pages) return 0;
    const all = data.pages.flatMap((page) => page.data ?? []);
    return all.filter((o: any) => !TERMINAL.has(o.status)).length;
  }, [data]);

  if (!isTabBarVisible(state)) {
    return null;
  }

  const homeIndex = state.routes.findIndex((route) => route.name === 'HomeTab');
  const ordersIndex = state.routes.findIndex((route) => route.name === 'OrdersTab');
  const settingsIndex = state.routes.findIndex((route) => route.name === 'SettingsTab');

  const navigateToTab = (tabIndex: number) => {
    if (tabIndex === -1) return;

    const route = state.routes[tabIndex];
    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });

    if (state.index !== tabIndex && !event.defaultPrevented) {
      navigation.navigate(route.name, route.params);
    }
  };

  return (
    <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, spacing.sm) + 12 }]}>
      <NavItem
        label="Accueil"
        icon={HomeIcon}
        active={state.index === homeIndex}
        onPress={() => navigateToTab(homeIndex)}
      />
      <NavItem
        label="Commandes"
        icon={OrdersIcon}
        active={state.index === ordersIndex}
        badge={activeOrdersCount > 0 ? String(Math.min(activeOrdersCount, 9)) : undefined}
        onPress={() => navigateToTab(ordersIndex)}
      />
      <NavItem
        label="Fidèles"
        icon={LoyaltyIcon}
        onPress={() => Alert.alert('Fidélisation', 'Fidélisation — bientôt')}
      />
      <NavItem
        label="Paramètres"
        icon={SettingsIcon}
        active={state.index === settingsIndex}
        onPress={() => navigateToTab(settingsIndex)}
      />
    </View>
  );
}

function NavItem({
  label,
  icon: Icon,
  active = false,
  onPress,
  badge,
}: {
  label: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  active?: boolean;
  onPress: () => void;
  badge?: string;
}) {
  return (
    <Pressable style={styles.navItem} onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
      <View>
        <Icon size={19} color={active ? colors.navy : colors.textMuted} />
        {badge ? <View style={styles.navBadge}><Text style={styles.navBadgeText}>{badge}</Text></View> : null}
      </View>
      <Text style={[styles.navLabel, active && styles.navLabelActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
    paddingHorizontal: 6,
    flexDirection: 'row',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    paddingVertical: 6,
    minHeight: 48,
  },
  navLabel: {
    color: colors.textMuted,
    fontSize: 9,
    fontFamily: 'DMSans_700Bold',
    marginTop: 2,
  },
  navLabelActive: {
    color: colors.navy,
  },
  navBadge: {
    position: 'absolute',
    top: -2,
    right: -8,
    width: 15,
    height: 15,
    borderRadius: radius.full,
    backgroundColor: colors.clay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBadgeText: {
    color: colors.white,
    fontSize: 8,
    fontFamily: 'DMSans_700Bold',
  },
});
