import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthEntryScreen } from '../screens/auth/AuthEntryScreen';

export type AuthStackParamList = {
  AuthEntry: undefined;
  SignInEmail: undefined;
  SignInPhone: undefined;
  SignUpEmail: undefined;
  SignUpPhone: undefined;
  Otp: { challengeId: string; phone: string };
  ForgotPassword: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AuthEntry" component={AuthEntryScreen} />
    </Stack.Navigator>
  );
}
