import React, { useCallback } from 'react';
import { StatusBar } from 'react-native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';
import { AuthProvider } from './src/contexts/AuthContext';
import { SocketProvider } from './src/contexts/SocketContext';
import './src/i18n';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30_000,
    },
  },
});

export default function App() {
  const [fontsLoaded] = useFonts({
    Fraunces_300Light: require('./assets/fonts/Fraunces-Light.ttf'),
    Fraunces_500Medium: require('./assets/fonts/Fraunces-Medium.ttf'),
    Fraunces_600SemiBold: require('./assets/fonts/Fraunces-SemiBold.ttf'),
    Fraunces_700Bold: require('./assets/fonts/Fraunces-Bold.ttf'),
    Fraunces_400Regular_Italic: require('./assets/fonts/Fraunces-Italic.ttf'),
    DMSans_300Light: require('./assets/fonts/DMSans-Light.ttf'),
    DMSans_400Regular: require('./assets/fonts/DMSans-Regular.ttf'),
    DMSans_500Medium: require('./assets/fonts/DMSans-Medium.ttf'),
    DMSans_600SemiBold: require('./assets/fonts/DMSans-SemiBold.ttf'),
    DMSans_700Bold: require('./assets/fonts/DMSans-Bold.ttf'),
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider onLayout={onLayoutRootView}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <SocketProvider>
            <StatusBar barStyle="dark-content" />
            <RootNavigator />
          </SocketProvider>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
