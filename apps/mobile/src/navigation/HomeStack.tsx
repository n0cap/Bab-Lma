import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../screens/home/HomeScreen';
import { ServiceSelectionScreen } from '../screens/booking/ServiceSelectionScreen';
import { ServiceDetailScreen } from '../screens/booking/ServiceDetailScreen';
import { OrderConfirmScreen } from '../screens/booking/OrderConfirmScreen';
import { SearchScreen } from '../screens/booking/SearchScreen';
import type { BookingStackParamList } from './BookingStack';

export type HomeStackParamList = {
  Home: undefined;
  Search: { orderId: string };
} & BookingStackParamList;

const Stack = createNativeStackNavigator<HomeStackParamList>();

export function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="ServiceSelection" component={ServiceSelectionScreen} />
      <Stack.Screen name="ServiceDetail" component={ServiceDetailScreen} />
      <Stack.Screen name="OrderConfirm" component={OrderConfirmScreen} />
      <Stack.Screen name="Search" component={SearchScreen} />
    </Stack.Navigator>
  );
}
