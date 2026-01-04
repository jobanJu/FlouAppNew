/**
 * components/BlurredPhotoCard.tsx
 * Affiche une photo avec un niveau de flou basé sur le statut du match
 * Avec animations fluides et transitions
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Text, Animated } from 'react-native';
import { BlurView } from 'expo-blur';
import { calculateBlurLevel, getBlurBadge, getUnlockMessage, MatchInfo } from '@/lib/blur-calculator';
import { AnimatedStatusBadge, AnimatedProgressBar, AnimatedCounter } from './AnimatedStatus';

interface Props {
  photoUrl: string;
  match: MatchInfo;
  onStatusChange?: (newStatus: string) => void;
}

export const BlurredPhotoCard = ({ photoUrl, match, onStatusChange }: Props) => {
  const blurLevelValue = useRef(new Animated.Value(calculateBlurLevel(match))).current;
  const badge = getBlurBadge(match);
  const unlockMessage = getUnlockMessage(match);
  const [prevStatus, setPrevStatus] = useState(match.status);

  // Animate blur level changes
  useEffect(() => {
    const blurLevel = calculateBlurLevel(match);
    Animated.timing(blurLevelValue, {
      toValue: blurLevel,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [match.status, blurLevelValue]);

  // Détecter les changements de statut
  useEffect(() => {
    if (match.status !== prevStatus) {
      setPrevStatus(match.status);
      onStatusChange?.(match.status);
    }
  }, [match.status, prevStatus, onStatusChange]);

  return (
    <View style={styles.container}>
      {/* Image avec blur animé */}
      <Image
        source={{ uri: photoUrl }}
        style={styles.image}
        resizeMode="cover"
      />

      {/* Blur overlay animé */}
      <Animated.View
        style={[
          styles.blurOverlay,
          {
            opacity: blurLevelValue.interpolate({
              inputRange: [0, 100],
              outputRange: [0, 0.8],
            }),
          },
        ]}
      >
        <BlurView
          // BlurView.intensity requires a number; control visibility via opacity above
          intensity={100}
          style={styles.blurOverlay}
        />
      </Animated.View>

      {/* Gradient overlay */}
      <View style={styles.gradientOverlay} />

      {/* Badge de statut avec animation */}
      <View style={styles.badgeContainer}>
        <AnimatedStatusBadge status={match.status as any} duration={600} />
      </View>

      {/* Information de déverrouillage */}
      <Animated.View
        style={[
          styles.infoContainer,
          {
            opacity: blurLevelValue.interpolate({
              inputRange: [0, 100],
              outputRange: [1, 0.6],
            }),
          },
        ]}
      >
        <Text style={styles.infoText}>{unlockMessage}</Text>
      </Animated.View>

      {/* Indicateur de progression animé */}
      {match.status !== 'day3' && (
        <View style={styles.progressContainer}>
          <AnimatedProgressBar
            progress={
              match.status === 'day1'
                ? (Math.min(match.messages_count_user_1, 3) / 3) * 50 +
                  (Math.min(match.messages_count_user_2, 3) / 3) * 50
                : (Math.min(match.messages_count_user_1, 6) / 6) * 50 +
                  (Math.min(match.messages_count_user_2, 6) / 6) * 50
            }
            duration={600}
            showLabel
          />
        </View>
      )}

      {/* Message counters animés */}
      <View style={styles.countersContainer}>
        <View style={styles.counterSection}>
          <AnimatedCounter count={match.messages_count_user_1} maxCount={6} />
          <Text style={styles.counterLabel}>Vos messages</Text>
        </View>
        <View style={styles.counterSection}>
          <AnimatedCounter count={match.messages_count_user_2} maxCount={6} />
          <Text style={styles.counterLabel}>Leurs messages</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: '100%',
    height: 500,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  blurOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  badgeContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  badge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  infoContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  infoText: {
    fontSize: 12,
    color: 'white',
    textAlign: 'center',
  },
  progressContainer: {
    position: 'absolute',
    bottom: 60,
    left: 16,
    right: 16,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#9b59b6',
    borderRadius: 2,
  },
  countersContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  counterSection: {
    alignItems: 'center',
    gap: 6,
  },
  counterLabel: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
