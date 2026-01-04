import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import GlassCard from '@/components/GlassCard';
import BlurImage from '@/components/BlurImage';
import theme from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useMatches } from '@/hooks/useMatches';
import { BlurredPhotoCard } from '@/components/BlurredPhotoCard';

const { width, height } = Dimensions.get('window');

interface Profile {
  id: string;
  firstName: string;
  age: number;
  photo: string;
  question: string;
  bio: string;
  blurLevel: number;
}

const MOCK_PROFILES: Profile[] = [
  {
    id: '1',
    firstName: 'Emma',
    age: 24,
    photo: 'https://via.placeholder.com/400x600?text=Emma',
    question: 'Quel endroit du monde t\'a le plus marqué ?',
    bio: 'Aventurière à cœur ☀️',
    blurLevel: 100,
  },
  {
    id: '2',
    firstName: 'Léa',
    age: 26,
    photo: 'https://via.placeholder.com/400x600?text=Lea',
    question: 'Qu\'est-ce que tu cherches vraiment ?',
    bio: 'Je crois aux vraies connexions 💜',
    blurLevel: 100,
  },
];

export default function SwipeScreen() {
  const [profiles, setProfiles] = useState<Profile[]>(MOCK_PROFILES);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scale = useSharedValue(1);

  const currentProfile = profiles[currentIndex];

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleLike = () => {
    if (!currentProfile) return;
    scale.value = withSpring(0.95, { damping: 10 });
    console.log('❤️ Like:', currentProfile.firstName);
    moveToNextProfile();
  };

  const handleReject = () => {
    if (!currentProfile) return;
    scale.value = withSpring(1.05, { damping: 10 });
    console.log('👋 Reject:', currentProfile.firstName);
    moveToNextProfile();
  };

  const moveToNextProfile = () => {
    if (currentIndex < profiles.length - 1) {
      setCurrentIndex(currentIndex + 1);
      scale.value = 1;
    } else {
      Alert.alert('Fin du deck', 'Tu as vu tous les profils ! 🎉');
      setCurrentIndex(0);
    }
  };

  if (!currentProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Pas de profils disponibles</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Flou.</Text>
          <Text style={styles.headerSubtitle}>Connexion émotionnelle</Text>
        </View>

        <View style={styles.cardContainer}>
          <Animated.View style={[animatedStyle, styles.cardWrapper]}>
            <GlassCard style={styles.card} intensity={30} rounded>
              <BlurImage
                uri={currentProfile.photo}
                blurLevel={currentProfile.blurLevel}
                style={styles.image}
              />

              <View style={styles.cardContent}>
                <View style={styles.identityBlock}>
                  <Text style={styles.name}>
                    {currentProfile.firstName}, {currentProfile.age}
                  </Text>
                </View>

                <View style={styles.questionBlock}>
                  <Text style={styles.questionLabel}>Question du jour</Text>
                  <Text style={styles.question}>{currentProfile.question}</Text>
                </View>

                <View style={styles.bioBlock}>
                  <Text style={styles.bio}>{currentProfile.bio}</Text>
                </View>
              </View>

              <View style={styles.heartIcon}>
                <Text style={styles.heart}>💜</Text>
              </View>
            </GlassCard>
          </Animated.View>

          {currentIndex + 1 < profiles.length && (
            <View style={styles.stackPreview}>
              <Text style={styles.stackText}>+1</Text>
            </View>
          )}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={handleReject}
            activeOpacity={0.7}
          >
            <Text style={styles.actionIcon}>👋</Text>
            <Text style={styles.actionLabel}>Pas maintenant</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnPrimary]}
            onPress={handleLike}
            activeOpacity={0.7}
          >
            <Text style={styles.actionIconPrimary}>💜</Text>
            <Text style={styles.actionLabelPrimary}>Intéressé</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.counter}>
          <Text style={styles.counterText}>
            {currentIndex + 1} / {profiles.length}
          </Text>
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.dark,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '500',
    marginTop: 2,
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  cardWrapper: {
    width: width - 40,
    height: height * 0.55,
  },
  card: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: 24,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  cardContent: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 18,
    zIndex: 10,
  },
  identityBlock: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.dark,
  },
  questionBlock: {
    backgroundColor: 'rgba(108, 92, 231, 0.12)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  questionLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.textMuted,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  question: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.dark,
    lineHeight: 20,
  },
  bioBlock: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bio: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontWeight: '500',
    lineHeight: 18,
  },
  heartIcon: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 15,
  },
  heart: {
    fontSize: 24,
  },
  stackPreview: {
    position: 'absolute',
    width: width - 45,
    height: height * 0.55 - 8,
    bottom: -8,
    left: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  stackText: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.textMuted,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(200, 200, 220, 0.3)',
    gap: 6,
  },
  actionBtnPrimary: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  actionIcon: {
    fontSize: 18,
  },
  actionIconPrimary: {
    fontSize: 18,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text,
  },
  actionLabelPrimary: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  counter: {
    alignItems: 'center',
    paddingBottom: 12,
  },
  counterText: {
    fontSize: 11,
    color: theme.colors.textMuted,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
});
