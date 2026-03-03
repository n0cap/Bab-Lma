import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ChatScreen } from '../screens/chat/ChatScreen';
import { ProOrderDetailScreen } from '../screens/pro/ProOrderDetailScreen';
import { OffersScreen } from '../screens/pro/OffersScreen';

export type OffersStackParamList = {
  Offers: undefined;
  ProOrderDetail: { orderId: string };
  Chat: { orderId: string };
};

const Stack = createNativeStackNavigator<OffersStackParamList>();

export function OffersStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Offers" component={OffersScreen} />
      <Stack.Screen name="ProOrderDetail" component={ProOrderDetailScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
    </Stack.Navigator>
  );
}
