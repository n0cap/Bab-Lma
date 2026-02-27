import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthStack } from './AuthStack';
import { MainTabs } from './MainTabs';

// Temporary: always show auth. Will be replaced by AuthContext in M2.
const IS_AUTHENTICATED = false;

export function RootNavigator() {
  return (
    <NavigationContainer>
      {IS_AUTHENTICATED ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
}
