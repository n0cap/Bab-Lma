import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { NavigatorScreenParams } from '@react-navigation/native';
import { ProStack } from './ProStack';
import type { ProStackParamList } from './ProStack';
import { ProStatsScreen } from '../screens/pro/ProStatsScreen';
import { ProfileScreen } from '../screens/settings/ProfileScreen';
import { colors } from '../theme';

export type ProMainTabsParamList = {
  ProHomeTab: NavigatorScreenParams<ProStackParamList>;
  ProStatsTab: undefined;
  ProSettingsTab: undefined;
};

const Tab = createBottomTabNavigator<ProMainTabsParamList>();

export function ProMainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
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
        tabBarIcon: ({ color }) => {
          let glyph = '◯';
          if (route.name === 'ProHomeTab') glyph = '⌂';
          if (route.name === 'ProStatsTab') glyph = '▤';
          if (route.name === 'ProSettingsTab') glyph = '◎';
          return <Text style={{ color, fontSize: 14 }}>{glyph}</Text>;
        },
      })}
    >
      <Tab.Screen
        name="ProHomeTab"
        component={ProStack}
        options={{ tabBarLabel: 'Missions' }}
      />
      <Tab.Screen
        name="ProStatsTab"
        component={ProStatsScreen}
        options={{ tabBarLabel: 'Stats' }}
      />
      <Tab.Screen
        name="ProSettingsTab"
        component={ProfileScreen}
        options={{ tabBarLabel: 'Profil' }}
      />
    </Tab.Navigator>
  );
}
