import { Stack } from 'expo-router';
import React from 'react';

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#f8f9fa' },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="edit-profile" />
      <Stack.Screen name="blocking" />
      <Stack.Screen name="support" />
    </Stack>
  );
}
