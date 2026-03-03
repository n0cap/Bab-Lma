import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { navigationRef } from '../navigation/RootNavigator';

type NotificationType = 'message' | 'offer' | 'status' | 'rate' | 'reminder';

type NotificationData = {
  type?: NotificationType;
  orderId?: string;
};

function isClientNav() {
  const routeNames = navigationRef.getRootState()?.routeNames ?? [];
  return routeNames.includes('OrdersTab');
}

function isProNav() {
  const routeNames = navigationRef.getRootState()?.routeNames ?? [];
  return routeNames.includes('ProHomeTab');
}

function navigateToOrderRoute(type: NotificationType, orderId: string) {
  if (!navigationRef.isReady()) return;

  if (type === 'message' || type === 'offer') {
    if (isProNav()) {
      navigationRef.navigate('ProHomeTab' as never, {
        screen: 'Chat',
        params: { orderId },
      } as never);
      return;
    }

    if (isClientNav()) {
      navigationRef.navigate('OrdersTab' as never, {
        screen: 'Chat',
        params: { orderId },
      } as never);
    }

    return;
  }

  if (type === 'status') {
    if (isProNav()) {
      navigationRef.navigate('ProHomeTab' as never, {
        screen: 'ProOrderDetail',
        params: { orderId },
      } as never);
      return;
    }

    if (isClientNav()) {
      navigationRef.navigate('OrdersTab' as never, {
        screen: 'OrderDetail',
        params: { orderId },
      } as never);
    }

    return;
  }

  if (type === 'rate' && isClientNav()) {
    navigationRef.navigate('OrdersTab' as never, {
      screen: 'Rating',
      params: { orderId },
    } as never);
    return;
  }

  if (type === 'reminder') {
    if (isProNav()) {
      navigationRef.navigate('ProHomeTab' as never, {
        screen: 'ProOrderDetail',
        params: { orderId },
      } as never);
      return;
    }

    if (isClientNav()) {
      navigationRef.navigate('OrdersTab' as never, {
        screen: 'OrderDetail',
        params: { orderId },
      } as never);
    }
  }
}

export async function registerForPushNotifications(
  registerToken: (token: string, platform: 'ios' | 'android') => Promise<void> | void,
) {
  if (!Device.isDevice) return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2B365A',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return;

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  const tokenData = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined,
  );

  const platform = Platform.OS === 'android' ? 'android' : 'ios';
  await registerToken(tokenData.data, platform);
}

// Show notification banners even when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export function setupNotificationTapHandler() {
  return Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data as NotificationData;
    if (!data.type || !data.orderId) return;
    navigateToOrderRoute(data.type, data.orderId);
  });
}
