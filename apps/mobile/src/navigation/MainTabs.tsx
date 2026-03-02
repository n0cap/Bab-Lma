import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { NavigatorScreenParams } from '@react-navigation/native';
import { HomeStack } from './HomeStack';
import type { HomeStackParamList } from './HomeStack';
import { OrdersStack } from './OrdersStack';
import type { OrdersStackParamList } from './OrdersStack';
import { ProfileScreen } from '../screens/settings/ProfileScreen';
import { BottomTabBar } from '../components';

export type MainTabsParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  OrdersTab: NavigatorScreenParams<OrdersStackParamList>;
  SettingsTab: undefined;
};

const Tab = createBottomTabNavigator<MainTabsParamList>();

export function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <BottomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStack}
        options={{ tabBarLabel: 'Accueil' }}
      />
      <Tab.Screen
        name="OrdersTab"
        component={OrdersStack}
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
