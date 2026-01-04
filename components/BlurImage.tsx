import React, { useState, useEffect } from 'react';
import { Image, StyleSheet, View, ViewStyle, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';

const { height } = Dimensions.get('window');

interface BlurImageProps {
  uri: string;
  blurLevel?: number; // 0-100 (0 = transparent, 100 = totalement flouté)
  style?: ViewStyle;
  animated?: boolean;
}

/**
 * BlurImage - Image avec flou progressif
 * Core du concept FLOU : plus la connexion progresse, plus l'image devient nette
 */
export default function BlurImage({
  uri,
  blurLevel = 100,
  style,
  animated = true,
}: BlurImageProps) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (uri) {
      Image.prefetch(uri).finally(() => setLoading(false));
    }
  }, [uri]);

  // Convertir blurLevel (0-100) en intensité Expo (0-100)
  const blurIntensity = Math.min(100, Math.max(0, blurLevel));

  return (
    <View style={[styles.container, style]}>
      {/* Image de base */}
      <Image
        source={{ uri }}
        style={styles.image}
        onLoadEnd={() => setLoading(false)}
      />

      {/* Couche de flou progressive */}
      {blurIntensity > 0 && (
        <BlurView
          intensity={blurIntensity}
          tint="light"
          style={[styles.blurOverlay, { opacity: blurIntensity / 100 }]}
        />
      )}

      {/* Vignette subtile pour profondeur */}
      <View style={styles.vignette} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: height * 0.7,
    overflow: 'hidden',
    borderRadius: 20,
    backgroundColor: '#f0f0f5',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  vignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
});
