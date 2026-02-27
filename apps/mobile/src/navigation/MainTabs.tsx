import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '../screens/home/HomeScreen';
import { OrdersListScreen } from '../screens/orders/OrdersListScreen';
import { ProfileScreen } from '../screens/settings/ProfileScreen';
import { colors } from '../theme';

export type MainTabsParamList = {
  HomeTab: undefined;
  OrdersTab: undefined;
  LoyaltyTab: undefined;
  SettingsTab: undefined;
};

const Tab = createBottomTabNavigator<MainTabsParamList>();

export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.navy,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: {
          fontSize: 9,
          fontWeight: '700',
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{ tabBarLabel: 'Accueil' }}
      />
      <Tab.Screen
        name="OrdersTab"
        component={OrdersListScreen}
        options={{ tabBarLabel: 'Commandes' }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={ProfileScreen}
        options={{ tabBarLabel: 'Paramètres' }}
      />
    </Tab.Navigator>
  );
}
