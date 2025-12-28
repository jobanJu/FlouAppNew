import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, useCallback } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const navigationState = useRootNavigationState();
  const [isLoading, setIsLoading] = useState(true);
  const [isOnboarded, setIsOnboarded] = useState<boolean | null>(null);

  const checkOnboarding = useCallback(async () => {
    try {
      const onboardingComplete = await AsyncStorage.getItem('flou_onboarding_complete');
      console.log('Onboarding status:', onboardingComplete);
      setIsOnboarded(onboardingComplete === 'true');
    } catch (e) {
      console.log('Error checking onboarding:', e);
      setIsOnboarded(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkOnboarding();
  }, [checkOnboarding]);

  useEffect(() => {
    if (isLoading || isOnboarded === null || !navigationState?.key) return;

    const inOnboarding = segments[0] === 'onboarding';
    console.log('Navigation check - isOnboarded:', isOnboarded, 'inOnboarding:', inOnboarding);

    if (!isOnboarded && !inOnboarding) {
      console.log('Redirecting to onboarding');
      router.replace('/onboarding');
    } else if (isOnboarded && inOnboarding) {
      console.log('Redirecting to tabs');
      router.replace('/(tabs)');
    }
  }, [isLoading, isOnboarded, segments, navigationState?.key]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#faf9ff' }}>
        <ActivityIndicator size="large" color="#667eea" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ gestureEnabled: true }} />
        <Stack.Screen name="settings" options={{ presentation: 'card' }} />
        <Stack.Screen name="onboarding" options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
        <Stack.Screen name="live-room" options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
