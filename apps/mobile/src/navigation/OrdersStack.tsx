import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OrdersListScreen } from '../screens/orders/OrdersListScreen';
import { OrderDetailScreen } from '../screens/orders/OrderDetailScreen';
import { ChatScreen } from '../screens/chat/ChatScreen';

export type OrdersStackParamList = {
  OrdersList: undefined;
  OrderDetail: { orderId: string };
  Chat: { orderId: string };
};

const Stack = createNativeStackNavigator<OrdersStackParamList>();

export function OrdersStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OrdersList" component={OrdersListScreen} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
    </Stack.Navigator>
  );
}
