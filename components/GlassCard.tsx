import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
  rounded?: boolean;
  transparent?: boolean;
}

/**
 * GlassCard - Composant principal FLOU
 * Utilise le glassmorphism avec flou progressif
 * Essence du design émotionnel
 */
export default function GlassCard({
  children,
  style,
  intensity = 40,
  rounded = true,
  transparent = false,
}: GlassCardProps) {
  return (
    <View style={[styles.card, rounded && styles.rounded, style]}>
      <BlurView intensity={intensity} tint="light" style={StyleSheet.absoluteFill} />
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: transparent
              ? 'rgba(255, 255, 255, 0.3)'
              : 'rgba(255, 255, 255, 0.5)',
          },
        ]}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  rounded: {
    borderRadius: 20,
  },
});
