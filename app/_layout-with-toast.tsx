/**
 * app/_layout.tsx
 * Root layout with ToastManager and global notifications
 */

import React, { useRef } from 'react';
import { Stack } from 'expo-router';
import { ToastManager, ToastManagerRef } from '@/components/ToastManager';

// Global toast ref for use in any screen
export const globalToastRef = React.createRef<ToastManagerRef>();

export default function RootLayout() {
  const toastRef = useRef<ToastManagerRef>(null);

  // Mirror local ref to exported global ref for simple access
  React.useEffect(() => {
    globalToastRef.current = toastRef.current;
  }, [toastRef.current]);

  return (
    <>
      {/* Toast notifications */}
      <ToastManager ref={toastRef} />

      {/* Navigation */}
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="chat/[id]" />
        <Stack.Screen name="profile/[id]" />
        <Stack.Screen name="session/create" />
        <Stack.Screen name="settings" />
      </Stack>
    </>
  );
}
