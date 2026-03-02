import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ChatScreen } from '../screens/chat/ChatScreen';
import { ProHomeScreen } from '../screens/pro/ProHomeScreen';
import { ProOrderDetailScreen } from '../screens/pro/ProOrderDetailScreen';

export type ProStackParamList = {
  ProHome: undefined;
  ProOrderDetail: { orderId: string };
  Chat: { orderId: string };
};

const Stack = createNativeStackNavigator<ProStackParamList>();

export function ProStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProHome" component={ProHomeScreen} />
      <Stack.Screen name="ProOrderDetail" component={ProOrderDetailScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
    </Stack.Navigator>
  );
}
