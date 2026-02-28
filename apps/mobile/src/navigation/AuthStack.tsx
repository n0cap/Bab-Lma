import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthEntryScreen } from '../screens/auth/AuthEntryScreen';
import { SignInEmailScreen } from '../screens/auth/SignInEmailScreen';
import { SignInPhoneScreen } from '../screens/auth/SignInPhoneScreen';
import { SignUpEmailScreen } from '../screens/auth/SignUpEmailScreen';
import { SignUpPhoneScreen } from '../screens/auth/SignUpPhoneScreen';
import { OtpScreen } from '../screens/auth/OtpScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';

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
      <Stack.Screen name="SignInEmail" component={SignInEmailScreen} />
      <Stack.Screen name="SignInPhone" component={SignInPhoneScreen} />
      <Stack.Screen name="SignUpEmail" component={SignUpEmailScreen} />
      <Stack.Screen name="SignUpPhone" component={SignUpPhoneScreen} />
      <Stack.Screen name="Otp" component={OtpScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
}
