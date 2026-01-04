import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function TabLayout() {
  const renderIcon = (glyph: string) => ({ focused }: { focused: boolean }) => (
    <View style={[styles.iconShell, focused && styles.iconShellActive]}>
      <Text style={[styles.iconText, focused && styles.iconTextActive]}>{glyph}</Text>
    </View>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarBackground: () => (
            <View style={styles.tabBarBg}>
              <BlurView intensity={50} tint="light" style={StyleSheet.absoluteFill} />
            </View>
          ),
          tabBarActiveTintColor: '#6c5ce7',
          tabBarInactiveTintColor: '#a0a3bd',
          tabBarShowLabel: false,
          tabBarItemStyle: styles.tabBarItem,
        }}>

        {/* Swipe - Découverte avec flou progressif */}
        <Tabs.Screen
          name="index"
          options={{ tabBarIcon: renderIcon('⊙') }}
        />

        {/* Live - Connexion en temps réel */}
        <Tabs.Screen
          name="live"
          options={{ tabBarIcon: renderIcon('●') }}
        />

        {/* Messages - Dialogues émotionnels */}
        <Tabs.Screen
          name="messages"
          options={{ tabBarIcon: renderIcon('✉') }}
        />

        {/* Profil - Mon espace personnel */}
        <Tabs.Screen
          name="profile"
          options={{ tabBarIcon: renderIcon('👤') }}
        />
      </Tabs>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    height: 68,
    borderRadius: 24,
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    elevation: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
  },
  tabBarBg: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderWidth: 1,
    borderColor: 'rgba(200,200,220,0.3)',
  },
  tabBarItem: {
    paddingVertical: 8,
  },
  iconShell: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  } as any,
  iconShellActive: {
    backgroundColor: 'rgba(108,92,231,0.08)',
  },
  iconText: {
    fontSize: 24,
    color: '#8b8e9f',
    fontWeight: '500',
    textAlign: 'center',
  },
  iconTextActive: {
    color: '#6c5ce7',
    fontWeight: '700',
  },
});
