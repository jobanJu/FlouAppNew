/**
 * components/BlurProgressiveCard.tsx
 * 
 * Affiche une photo avec défloutage progressif selon le statut du match
 * Montre aussi la progression vers le déverrouillage
 */

import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  Dimensions,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { BlurView } from 'expo-blur';
import GlassCard from './GlassCard';
import theme from '@/constants/theme';
import { useBlurLogic, type Match } from '@/lib/blur-logic';

const { width, height } = Dimensions.get('window');

interface BlurProgressiveCardProps {
  match: Match;
  photoUrl: string | { uri: string };
  userName: string;
  userAge: number;
  onMessagePress?: () => void;
}

export default function BlurProgressiveCard({
  match,
  photoUrl,
  userName,
  userAge,
  onMessagePress,
}: BlurProgressiveCardProps) {
  const { blurLevel, unlockProgress, unlockMessage, nextStatus } =
    useBlurLogic(match);

  const handleUnlockInfo = () => {
    Alert.alert(
      'Déverrouillage progressif',
      unlockMessage + '\n\nÉchangez des messages pour voir la vraie photo! 💬',
      [{ text: 'OK' }]
    );
  };

  return (
    <GlassCard style={styles.container} intensity={20}>
      {/* Image avec flou */}
      <View style={styles.imageContainer}>
        {typeof photoUrl === 'string' ? (
          <Image
            source={{ uri: photoUrl }}
            style={styles.image}
            onError={(error) =>
              console.error('Image error:', error.nativeEvent.error)
            }
          />
        ) : (
          <Image source={photoUrl} style={styles.image} />
        )}

        {/* Overlay de flou */}
        {blurLevel > 0 && (
          <BlurView intensity={blurLevel} style={styles.blurOverlay}>
            <View style={styles.blurContent}>
              {blurLevel === 100 && (
                <>
                  <Text style={styles.blurIcon}>🌫️</Text>
                  <Text style={styles.blurText}>
                    Photo flouée le J1
                  </Text>
                </>
              )}

              {blurLevel === 50 && (
                <>
                  <Text style={styles.blurIcon}>👥</Text>
                  <Text style={styles.blurText}>
                    Photo partiellement visible (J2)
                  </Text>
                </>
              )}
            </View>
          </BlurView>
        )}

        {/* Badge statut */}
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                blurLevel === 0
                  ? 'rgba(38, 208, 124, 0.9)' // Green J3
                  : blurLevel === 50
                    ? 'rgba(240, 162, 2, 0.9)' // Orange J2
                    : 'rgba(108, 92, 231, 0.9)', // Purple J1
            },
          ]}
        >
          <Text style={styles.statusText}>
            {blurLevel === 0 ? '✅ J3' : blurLevel === 50 ? '⏳ J2' : '🌫️ J1'}
          </Text>
        </View>
      </View>

      {/* Infos utilisateur */}
      <View style={styles.infoSection}>
        <View style={styles.nameRow}>
          <Text style={styles.userName}>
            {userName}, {userAge}
          </Text>
        </View>

        {/* Progression de déverrouillage */}
        <View style={styles.progressSection}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${unlockProgress.progressPercent}%`,
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {unlockProgress.currentLevel === 1 &&
              `${unlockProgress.nextThreshold - match.messages_count} messages pour J2`}
            {unlockProgress.currentLevel === 2 &&
              `${unlockProgress.nextThreshold - match.messages_count} messages pour J3`}
            {unlockProgress.currentLevel === 3 && '✅ Photo déverrouillée!'}
          </Text>
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={onMessagePress || handleUnlockInfo}
          activeOpacity={0.8}
        >
          <Text style={styles.ctaIcon}>💬</Text>
          <Text style={styles.ctaText}>Discuter</Text>
        </TouchableOpacity>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 3 / 4,
    position: 'relative',
    backgroundColor: theme.colors.surface,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blurContent: {
    alignItems: 'center',
    gap: 8,
  },
  blurIcon: {
    fontSize: 48,
  },
  blurText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    textAlign: 'center',
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  infoSection: {
    padding: 14,
    gap: 12,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.dark,
  },
  progressSection: {
    gap: 6,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 11,
    color: theme.colors.textMuted,
    fontWeight: '500',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: `${theme.colors.primary}15`,
    borderRadius: 10,
  },
  ctaIcon: {
    fontSize: 16,
  },
  ctaText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.primary,
  },
});
