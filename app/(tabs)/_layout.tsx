import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function TabLayout() {
  const renderIcon = (glyph: string) => {
    const IconComponent = ({ focused }: { focused: boolean }) => (
      <View style={[styles.iconShell, focused && styles.iconShellActive]}>
        <Text style={[styles.iconText, focused && styles.iconTextActive]}>{glyph}</Text>
      </View>
    );
    IconComponent.displayName = `TabIcon_${glyph}`;
    return IconComponent;
  };

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

        <Tabs.Screen
          name="index"
          options={{ tabBarIcon: renderIcon('⌂') }}
        />

        <Tabs.Screen
          name="messages"
          options={{ tabBarIcon: renderIcon('✉') }}
        />

        <Tabs.Screen
          name="explore"
          options={{ tabBarIcon: renderIcon('♥') }}
        />

        <Tabs.Screen
          name="live"
          options={{ tabBarIcon: renderIcon('●') }}
        />

        <Tabs.Screen
          name="shop"
          options={{ tabBarIcon: renderIcon('🛒') }}
        />
      </Tabs>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 16,
    left: 20,
    right: 20,
    height: 72,
    borderRadius: 24,
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    elevation: 0,
    shadowColor: '#6c5ce7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
  },
  tabBarBg: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(108,92,231,0.12)',
  },
  tabBarItem: {
    paddingVertical: 8,
  },
  iconShell: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconShellActive: {
    backgroundColor: 'rgba(108,92,231,0.12)',
  },
  iconText: {
    fontSize: 22,
    color: '#a0a3bd',
    fontWeight: '600',
    textAlign: 'center',
  },
  iconTextActive: {
    color: '#6c5ce7',
    fontWeight: '800',
  },
});
