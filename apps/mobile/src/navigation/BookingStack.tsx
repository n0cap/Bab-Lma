import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ServiceSelectionScreen } from '../screens/booking/ServiceSelectionScreen';
import { ServiceDetailScreen } from '../screens/booking/ServiceDetailScreen';
import { OrderConfirmScreen } from '../screens/booking/OrderConfirmScreen';

export type BookingStackParamList = {
  ServiceSelection: undefined;
  ServiceDetail: { serviceType: 'menage' | 'cuisine' | 'childcare' };
  OrderConfirm: {
    serviceType: 'menage' | 'cuisine' | 'childcare';
    detail: Record<string, unknown>;
    estimate: { floorPrice: number; ceiling: number; durationMinutes: { min: number; max: number } };
  };
};

const Stack = createNativeStackNavigator<BookingStackParamList>();

export function BookingStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ServiceSelection" component={ServiceSelectionScreen} />
      <Stack.Screen name="ServiceDetail" component={ServiceDetailScreen} />
      <Stack.Screen name="OrderConfirm" component={OrderConfirmScreen} />
    </Stack.Navigator>
  );
}
