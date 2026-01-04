import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRootNavigationState, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import theme from '@/constants/theme';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuth } from '../hooks/useAuth';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const navigationState = useRootNavigationState();
  const { user, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isOnboarded, setIsOnboarded] = useState<boolean | null>(null);

  const checkOnboarding = useCallback(async () => {
    try {
      if (!user) {
        // Not authenticated
        setIsOnboarded(null);
        setIsLoading(false);
        return;
      }

      // Check Supabase for onboarding completion
      const onboardingComplete = await AsyncStorage.getItem('flou_onboarding_complete');
      console.log('✅ Onboarding status from localStorage:', onboardingComplete);
      setIsOnboarded(onboardingComplete === 'true');
    } catch (e) {
      console.log('Error checking onboarding:', e);
      setIsOnboarded(false);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return; // Still loading auth
    checkOnboarding();
  }, [authLoading, checkOnboarding]);

  useEffect(() => {
    if (isLoading || isOnboarded === null || !navigationState?.key) return;

    console.log('=== NAVIGATION ROUTING ===');
    console.log('User:', user ? `✅ ${user.email}` : '❌ Not authenticated');
    console.log('Onboarded:', isOnboarded);
    console.log('Segment:', segments[0]);
    console.log('========================');

    if (!user) {
      // Not authenticated → show login/auth screens
      console.log('🔐 Routing to login');
      router.replace('/(auth)/login');
    } else if (!isOnboarded) {
      // Authenticated but onboarding not complete → show onboarding
      console.log('🧅 Routing to onboarding');
      router.replace('/onboarding');
    } else {
      // Authenticated and onboarded → show main app
      console.log('✅ Routing to main app');
      router.replace('/(tabs)');
    }
  }, [isLoading, isOnboarded, user, segments, navigationState?.key]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ gestureEnabled: true }} />
        <Stack.Screen name="settings" options={{ presentation: 'card' }} />
        <Stack.Screen name="onboarding" options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
        <Stack.Screen name="live-room" options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
