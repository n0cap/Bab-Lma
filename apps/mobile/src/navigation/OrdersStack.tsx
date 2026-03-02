import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OrdersListScreen } from '../screens/orders/OrdersListScreen';
import { OrderDetailScreen } from '../screens/orders/OrderDetailScreen';
import { ChatScreen } from '../screens/chat/ChatScreen';
import { RatingScreen } from '../screens/orders/RatingScreen';
import { OrderConfirmedScreen } from '../screens/orders/OrderConfirmedScreen';
import { StatusTrackingScreen } from '../screens/orders/StatusTrackingScreen';

export type TrackingOrderParams = {
  orderId: string;
  serviceType: string;
  proName: string;
  eta: string;
  price: number;
  address: string;
};

export type OrdersStackParamList = {
  OrdersList: undefined;
  OrderDetail: { orderId: string };
  Chat: { orderId: string };
  Rating: { orderId: string };
  OrderConfirmed: TrackingOrderParams | undefined;
  StatusTracking: TrackingOrderParams | undefined;
};

const Stack = createNativeStackNavigator<OrdersStackParamList>();

export function OrdersStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OrdersList" component={OrdersListScreen} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="Rating" component={RatingScreen} />
      <Stack.Screen name="OrderConfirmed" component={OrderConfirmedScreen} />
      <Stack.Screen name="StatusTracking" component={StatusTrackingScreen} />
    </Stack.Navigator>
  );
}
