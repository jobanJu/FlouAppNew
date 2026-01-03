import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';

const { width, height } = Dimensions.get('window');

export default function MatchingScreen() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();

  const pan = new Animated.ValueXY();

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }]),
    onPanResponderRelease: (e, { dx, dy, vx, vy }) => {
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);

      // Swipe left (reject) ou right (like)
      if (absX > 120 || Math.abs(vx) > 0.5) {
        const direction = dx > 0 ? 1 : -1; // right = like, left = reject
        handleSwipe(direction);
      } else {
        // Snap back
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false,
        }).start();
      }
    },
  });

  useEffect(() => {
    const fetchProfiles = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.from('profiles').select('*').limit(50);
        if (error) throw error;
        setProfiles(data || []);
      } catch (e: any) {
        Alert.alert('Erreur', e.message || 'Impossible de charger les profils.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfiles();
  }, []);

  const handleSwipe = (direction: number) => {
    const currentProfile = profiles[currentIndex];

    if (direction > 0) {
      // Like
      console.log('❤️ Like:', currentProfile?.id);
      // TODO: Save like to database
    } else {
      // Reject
      console.log('✕ Reject:', currentProfile?.id);
      // TODO: Save reject to database
    }

    // Animate out
    Animated.timing(pan, {
      toValue: { x: direction * (width + 200), y: 0 },
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      pan.setValue({ x: 0, y: 0 });
      setCurrentIndex(currentIndex + 1);
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#667eea" />
      </View>
    );
  }

  if (currentIndex >= profiles.length) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.emptyText}>Pas de profils à afficher</Text>
        <Text style={styles.emptySubtext}>Reviens plus tard !</Text>
      </View>
    );
  }

  const profile = profiles[currentIndex];
  const nextProfile = profiles[currentIndex + 1];

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={[styles.header, { paddingTop: insets.top }]}>
        <Text style={styles.headerTitle}>Matching</Text>
      </SafeAreaView>

      <View style={styles.cardStack}>
        {/* Next card (visible behind) */}
        {nextProfile && (
          <View style={[styles.card, styles.nextCard]}>
            <Image
              source={{ uri: nextProfile.avatar_url || 'https://via.placeholder.com/300' }}
              style={styles.cardImage}
              cachePolicy="memory-disk"
            />
            <View style={styles.cardInfo}>
              <Text style={styles.cardName}>
                {nextProfile.first_name || 'Utilisateur'}{' '}
                {nextProfile.age ? `, ${nextProfile.age}` : ''}
              </Text>
              <Text style={styles.cardLocation}>
                {nextProfile.city || 'Localisation inconnue'}
              </Text>
            </View>
          </View>
        )}

        {/* Main card */}
        <Animated.View
          style={[
            styles.card,
            {
              transform: [{ translateX: pan.x }, { translateY: pan.y }],
            },
          ]}
          {...panResponder.panHandlers}>
          <Image
            source={{ uri: profile.avatar_url || 'https://via.placeholder.com/300' }}
            style={styles.cardImage}
            cachePolicy="memory-disk"
          />
          <View style={styles.cardInfo}>
            <Text style={styles.cardName}>
              {profile.first_name || 'Utilisateur'} {profile.age ? `, ${profile.age}` : ''}
            </Text>
            <Text style={styles.cardBio}>{profile.bio || ''}</Text>
            <Text style={styles.cardLocation}>{profile.city || 'Localisation inconnue'}</Text>
          </View>

          {/* Overlay text (Reject/Like) */}
          <Animated.View
            style={[
              styles.overlay,
              {
                opacity: pan.x.interpolate({
                  inputRange: [-200, 0, 200],
                  outputRange: [1, 0, 1],
                }),
              },
            ]}>
            <Text style={[styles.overlayText, pan.x.interpolate({
              inputRange: [-200, 0],
              outputRange: [0, 1],
            }) as any]}>REJECT</Text>
            <Text style={[styles.overlayText, styles.overlayLike, pan.x.interpolate({
              inputRange: [0, 200],
              outputRange: [1, 0],
            }) as any]}>LIKE ❤️</Text>
          </Animated.View>
        </Animated.View>
      </View>

      {/* Action buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.button, styles.rejectButton]}
          onPress={() => handleSwipe(-1)}>
          <Text style={styles.buttonText}>✕</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.likeButton]}
          onPress={() => handleSwipe(1)}>
          <Text style={styles.buttonText}>❤️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#faf9ff',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#faf9ff',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
  },
  cardStack: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  card: {
    width: width - 32,
    height: height * 0.65,
    borderRadius: 20,
    backgroundColor: '#fff',
    overflow: 'hidden',
    position: 'absolute',
    shadowColor: '#6c5ce7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  nextCard: {
    transform: [{ scale: 0.95 }],
    opacity: 0.7,
  },
  cardImage: {
    width: '100%',
    height: '70%',
    backgroundColor: '#e0e0e0',
  },
  cardInfo: {
    padding: 16,
    backgroundColor: '#fff',
    flex: 1,
    justifyContent: 'space-between',
  },
  cardName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  cardBio: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
    lineHeight: 18,
  },
  cardLocation: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  overlayText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ff6b6b',
  },
  overlayLike: {
    color: '#51cf66',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  button: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  rejectButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#ff6b6b',
  },
  likeButton: {
    backgroundColor: '#51cf66',
  },
  buttonText: {
    fontSize: 28,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
});
