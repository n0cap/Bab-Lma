import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator, View } from 'react-native';
import { AuthStack } from './AuthStack';
import { MainTabs } from './MainTabs';
import { ProMainTabs } from './ProMainTabs';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../theme';

export function RootNavigator() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.navy} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!isAuthenticated ? <AuthStack /> : user?.role === 'pro' ? <ProMainTabs /> : <MainTabs />}
    </NavigationContainer>
  );
}
