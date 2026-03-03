import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { NavigatorScreenParams } from '@react-navigation/native';
import { ChatIcon, HomeIcon, OrdersIcon, SettingsIcon } from '../components/icons';
import { OffersStack } from './OffersStack';
import type { OffersStackParamList } from './OffersStack';
import { ProStack } from './ProStack';
import type { ProStackParamList } from './ProStack';
import { ProChatListScreen } from '../screens/pro/ProChatListScreen';
import { ChatScreen } from '../screens/chat/ChatScreen';
import { ProProfileScreen } from '../screens/pro/ProProfileScreen';
import { ProfileScreen } from '../screens/settings/ProfileScreen';
import { colors } from '../theme';

export type ProProfileStackParamList = {
  ProProfile: undefined;
  ProfileEdit: undefined;
};

export type ProChatStackParamList = {
  ProChatList: undefined;
  Chat: { orderId: string };
};

export type ProMainTabsParamList = {
  ProHomeTab: NavigatorScreenParams<ProStackParamList>;
  ProOffersTab: NavigatorScreenParams<OffersStackParamList>;
  ProChatTab: NavigatorScreenParams<ProChatStackParamList>;
  ProSettingsTab: NavigatorScreenParams<ProProfileStackParamList>;
};

const Tab = createBottomTabNavigator<ProMainTabsParamList>();
const ProProfileStackNavigator = createNativeStackNavigator<ProProfileStackParamList>();
const ProChatStackNavigator = createNativeStackNavigator<ProChatStackParamList>();

function ProChatStack() {
  return (
    <ProChatStackNavigator.Navigator screenOptions={{ headerShown: false }}>
      <ProChatStackNavigator.Screen name="ProChatList" component={ProChatListScreen} />
      <ProChatStackNavigator.Screen name="Chat" component={ChatScreen} />
    </ProChatStackNavigator.Navigator>
  );
}

function ProProfileStack() {
  return (
    <ProProfileStackNavigator.Navigator screenOptions={{ headerShown: false }}>
      <ProProfileStackNavigator.Screen name="ProProfile" component={ProProfileScreen} />
      <ProProfileStackNavigator.Screen name="ProfileEdit" component={ProfileScreen} />
    </ProProfileStackNavigator.Navigator>
  );
}

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
          if (route.name === 'ProHomeTab') return <HomeIcon size={16} color={color} />;
          if (route.name === 'ProOffersTab') return <OrdersIcon size={16} color={color} />;
          if (route.name === 'ProChatTab') return <ChatIcon size={16} color={color} />;
          return <SettingsIcon size={16} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="ProHomeTab"
        component={ProStack}
        options={{ tabBarLabel: 'Missions' }}
      />
      <Tab.Screen
        name="ProOffersTab"
        component={OffersStack}
        options={{ tabBarLabel: 'Offres' }}
      />
      <Tab.Screen
        name="ProChatTab"
        component={ProChatStack}
        options={{ tabBarLabel: 'Chat' }}
      />
      <Tab.Screen
        name="ProSettingsTab"
        component={ProProfileStack}
        options={{ tabBarLabel: 'Profil' }}
      />
    </Tab.Navigator>
  );
}
