import React, { useEffect } from 'react';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { ActivityIndicator, View } from 'react-native';
import { AuthStack } from './AuthStack';
import { MainTabs } from './MainTabs';
import { ProMainTabs } from './ProMainTabs';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../theme';
import { setupNotificationTapHandler } from '../services/notifications';

export const navigationRef = createNavigationContainerRef();

export function RootNavigator() {
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    const subscription = setupNotificationTapHandler();
    return () => {
      subscription.remove();
    };
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.navy} />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      {!isAuthenticated ? <AuthStack /> : user?.role === 'pro' ? <ProMainTabs /> : <MainTabs />}
    </NavigationContainer>
  );
}
