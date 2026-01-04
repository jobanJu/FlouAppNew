import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import GlassCard from '@/components/GlassCard';
import theme from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useMatches } from '@/hooks/useMatches';
import { BlurredPhotoCard } from '@/components/BlurredPhotoCard';

const { width, height } = Dimensions.get('window');

export default function SwipeScreen() {
  const { user, loading: authLoading } = useAuth();
  const { matches, loading: matchesLoading, error } = useMatches(user?.id || '');
  const [currentIndex, setCurrentIndex] = useState(0);
  const scale = useSharedValue(1);

  const currentMatch = matches[currentIndex];

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleLike = async () => {
    if (!currentMatch) return;
    scale.value = withSpring(0.95, { damping: 10 });
    
    // TODO: Add like logic here
    console.log('❤️ Like:', currentMatch);
    moveToNextMatch();
  };

  const handleReject = () => {
    if (!currentMatch) return;
    scale.value = withSpring(1.05, { damping: 10 });
    
    // TODO: Add reject logic here
    console.log('👋 Reject:', currentMatch);
    moveToNextMatch();
  };

  const moveToNextMatch = () => {
    if (currentIndex < matches.length - 1) {
      setCurrentIndex(currentIndex + 1);
      scale.value = 1;
    } else {
      Alert.alert('Fin du deck', 'Tu as vu tous les matches ! 🎉');
      setCurrentIndex(0);
    }
  };

  // Loading states
  if (authLoading || matchesLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Chargement des matches...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>❌ Erreur: {error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => window.location.reload()}
          >
            <Text style={styles.retryText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // No matches state
  if (!matches || matches.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>😢 Pas de matches pour le moment</Text>
          <Text style={styles.emptySubtext}>Repasse plus tard!</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentMatch) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>Pas de profils disponibles</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Get the other user's profile (user_1 or user_2)
  const otherUserId = currentMatch.user_1 === user?.id ? currentMatch.user_2 : currentMatch.user_1;
  const unblurProgress = currentMatch.status === 'day1' ? 'Day 1 - Blurred 🌫️' :
                         currentMatch.status === 'day2' ? 'Day 2 - 50% Visible ⏳' :
                         'Day 3 - Fully Visible ✅';

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Flou.</Text>
          <Text style={styles.headerSubtitle}>Connexion émotionnelle</Text>
        </View>

        {/* Match Card with BlurredPhotoCard */}
        <View style={styles.cardContainer}>
          <Animated.View style={[animatedStyle, styles.cardWrapper]}>
            {/* Using BlurredPhotoCard component for automatic blur handling */}
            <BlurredPhotoCard
              photoUrl={currentMatch.photo_url || 'https://via.placeholder.com/400x600?text=Profile'}
              match={currentMatch}
              onStatusChange={(newStatus) => {
                console.log('Match status changed to:', newStatus);
                // Trigger re-render on status change
              }}
            />
          </Animated.View>

          {/* Stack preview indicator */}
          {currentIndex + 1 < matches.length && (
            <View style={styles.stackPreview}>
              <Text style={styles.stackText}>+{matches.length - currentIndex - 1}</Text>
            </View>
          )}
        </View>

        {/* Status indicator */}
        <View style={styles.statusBar}>
          <View style={[
            styles.statusIndicator,
            {
              backgroundColor: currentMatch.status === 'day1' ? '#FFB347' :
                             currentMatch.status === 'day2' ? '#87CEEB' :
                             '#90EE90'
            }
          ]} />
          <Text style={styles.statusText}>{unblurProgress}</Text>
        </View>

        {/* Action buttons */}
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

        {/* Counter */}
        <View style={styles.counter}>
          <Text style={styles.counterText}>
            {currentIndex + 1} / {matches.length}
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
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
    marginBottom: 20,
  },
  cardWrapper: {
    width: width - 40,
    height: height * 0.52,
  },
  stackPreview: {
    position: 'absolute',
    width: width - 45,
    height: height * 0.52 - 8,
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
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 10,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
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
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  errorText: {
    fontSize: 14,
    color: theme.colors.error || '#FF6B6B',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
  },
});
