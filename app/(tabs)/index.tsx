import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { getDeviceId } from '../../lib/device-id';
import { 
  Dimensions, 
  Image, 
  Modal, 
  Platform, 
  Pressable, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View,
  Animated,
  PanResponder,
  Alert,
  ScrollView,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');
const SWIPE_THRESHOLD = 120;

// Profils mock avec photos
const MOCK_PROFILES = [
  {
    id: '1',
    name: 'Emma',
    age: 24,
    city: 'Paris',
    tag: 'ARTISTE',
    bio: "L'ananas sur la pizza, c'est oui. 🍕",
    emojis: '🎨✨🌸',
    interests: ['Art', 'Musique', 'Voyage'],
    photos: [
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400',
    ],
    verified: true,
    distance: '2 km',
  },
  {
    id: '2',
    name: 'Lucas',
    age: 27,
    city: 'Lyon',
    tag: 'SPORTIF',
    bio: 'Café le matin, running le soir ☕',
    emojis: '💪🏃‍♂️☀️',
    interests: ['Sport', 'Fitness', 'Nutrition'],
    photos: [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    ],
    verified: true,
    distance: '5 km',
  },
  {
    id: '3',
    name: 'Chloé',
    age: 23,
    city: 'Bordeaux',
    tag: 'VOYAGEUSE',
    bio: 'Next stop: Tokyo 🗼',
    emojis: '✈️🌏📸',
    interests: ['Voyage', 'Photo', 'Cuisine'],
    photos: [
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400',
      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400',
    ],
    verified: false,
    distance: '12 km',
  },
  {
    id: '4',
    name: 'Thomas',
    age: 29,
    city: 'Marseille',
    tag: 'MUSICIEN',
    bio: 'La vie est trop courte pour écouter de la mauvaise musique 🎸',
    emojis: '🎵🎸🎧',
    interests: ['Musique', 'Concert', 'Guitare'],
    photos: [
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
    ],
    verified: true,
    distance: '8 km',
  },
  {
    id: '5',
    name: 'Léa',
    age: 25,
    city: 'Toulouse',
    tag: 'FOODIE',
    bio: 'Je connais tous les restos de la ville 🍽️',
    emojis: '🍜🍷🧁',
    interests: ['Cuisine', 'Restaurant', 'Vin'],
    photos: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
    ],
    verified: true,
    distance: '3 km',
  },
];

const ICEBREAKERS = [
  'Ibiza ou Bali ?',
  'Lève-tôt ou couche-tard ?',
  'Brunch ou after ?',
];

// Coûts en Brumes
const BRUMES_COSTS = {
  vocal: 100,
  reseaux: 100,
  defloutage: 100,
  boost: 300,
  vocal_premium: 300,
  superlike: 300,
};

export default function SwipeScreen() {
  const router = useRouter();
  const [profiles] = useState(MOCK_PROFILES);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [menuVisible, setMenuVisible] = useState(false);
  const [matchModal, setMatchModal] = useState(false);
  const [matchedProfile, setMatchedProfile] = useState<typeof MOCK_PROFILES[0] | null>(null);
  const [likedProfiles, setLikedProfiles] = useState<string[]>([]);
  const [superLikedProfiles, setSuperLikedProfiles] = useState<string[]>([]);
  const [myBrumes, setMyBrumes] = useState(100);
  const [isBoostActive, setIsBoostActive] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Daily reward system
  const [showDailyReward, setShowDailyReward] = useState(false);
  const [consecutiveDays, setConsecutiveDays] = useState(1);
  const [todayRewardClaimed, setTodayRewardClaimed] = useState(false);

  // Check daily reward and load profile on mount
  useEffect(() => {
    loadUserProfile();
    checkDailyReward();
  }, []);

  const loadUserProfile = async () => {
    try {
      // D'abord charger depuis le local
      const localProfile = await AsyncStorage.getItem('flou_user_profile');
      if (localProfile) {
        const profile = JSON.parse(localProfile);
        setMyBrumes(profile.brumes || 100);
      }

      // Ensuite synchroniser avec Supabase
      const deviceId = await getDeviceId();
      const { data, error } = await supabase
        .from('profiles')
        .select('brumes')
        .eq('device_id', deviceId)
        .single();

      if (data && !error) {
        setMyBrumes(data.brumes || 100);
        // Mettre à jour le local
        if (localProfile) {
          const profile = JSON.parse(localProfile);
          profile.brumes = data.brumes;
          await AsyncStorage.setItem('flou_user_profile', JSON.stringify(profile));
        }
      }
    } catch (e) {
      console.log('Error loading profile:', e);
    }
  };

  const checkDailyReward = async () => {
    try {
      const lastClaimDate = await AsyncStorage.getItem('flou_last_daily_claim');
      const streakStr = await AsyncStorage.getItem('flou_daily_streak');
      const today = new Date().toDateString();
      
      if (streakStr) {
        setConsecutiveDays(parseInt(streakStr) || 1);
      }
      
      if (lastClaimDate !== today) {
        // Nouvelle journée, afficher la récompense
        setTimeout(() => {
          setShowDailyReward(true);
        }, 1000);
      } else {
        setTodayRewardClaimed(true);
      }
    } catch (e) {
      console.log('Error checking daily reward:', e);
    }
  };

  const claimDailyReward = async () => {
    const baseReward = 5;
    const isTenthDay = (consecutiveDays + 1) % 10 === 0;
    const bonusReward = isTenthDay ? 10 : 0;
    const totalReward = baseReward + bonusReward;
    
    const newBrumes = myBrumes + totalReward;
    const newStreak = consecutiveDays + 1;
    
    setMyBrumes(newBrumes);
    setTodayRewardClaimed(true);
    setShowDailyReward(false);
    setConsecutiveDays(newStreak);
    
    try {
      const today = new Date().toDateString();
      await AsyncStorage.setItem('flou_last_daily_claim', today);
      await AsyncStorage.setItem('flou_daily_streak', newStreak.toString());
      
      // Mettre à jour le profil local
      const localProfile = await AsyncStorage.getItem('flou_user_profile');
      if (localProfile) {
        const profile = JSON.parse(localProfile);
        profile.brumes = newBrumes;
        await AsyncStorage.setItem('flou_user_profile', JSON.stringify(profile));
      }
      
      // Synchroniser avec Supabase
      const deviceId = await getDeviceId();
      await supabase
        .from('profiles')
        .update({ brumes: newBrumes })
        .eq('device_id', deviceId);
        
      // Enregistrer la transaction
      await supabase
        .from('brumes_transactions')
        .insert({
          user_id: deviceId,
          amount: totalReward,
          type: 'daily_reward',
          description: `Récompense jour ${newStreak}${isTenthDay ? ' (bonus 10ème jour)' : ''}`,
        });
    } catch (e) {
      console.log('Error saving daily reward:', e);
    }
    
    Alert.alert(
      '🎁 Récompense quotidienne !',
      `+${baseReward} ☁️ Brumes${isTenthDay ? `\n+${bonusReward} ☁️ Bonus 10ème jour !` : ''}\n\nTotal: +${totalReward} Brumes\nJours consécutifs: ${newStreak}`,
      [{ text: 'Super !', style: 'default' }]
    );
  };

  const position = useRef(new Animated.ValueXY()).current;
  const rotate = position.x.interpolate({
    inputRange: [-width / 2, 0, width / 2],
    outputRange: ['-15deg', '0deg', '15deg'],
    extrapolate: 'clamp',
  });
  const likeOpacity = position.x.interpolate({
    inputRange: [0, width / 4],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const nopeOpacity = position.x.interpolate({
    inputRange: [-width / 4, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          swipeRight();
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          swipeLeft();
        } else {
          resetPosition();
        }
      },
    })
  ).current;

  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: true,
    }).start();
  };

  const swipeLeft = () => {
    Animated.timing(position, {
      toValue: { x: -width - 100, y: 0 },
      duration: 300,
      useNativeDriver: true,
    }).start(() => handleSwipeComplete('dislike'));
  };

  const swipeRight = () => {
    Animated.timing(position, {
      toValue: { x: width + 100, y: 0 },
      duration: 300,
      useNativeDriver: true,
    }).start(() => handleSwipeComplete('like'));
  };

  const handleSwipeComplete = (action: 'like' | 'dislike' | 'superlike') => {
    const profile = profiles[currentIndex];
    
    if (action === 'like' || action === 'superlike') {
      if (action === 'superlike') {
        setSuperLikedProfiles(prev => [...prev, profile.id]);
      } else {
        setLikedProfiles(prev => [...prev, profile.id]);
      }
      
      // Simuler un match (30% de chance)
      if (Math.random() < 0.3) {
        setMatchedProfile(profile);
        setMatchModal(true);
      }
    }
    
    position.setValue({ x: 0, y: 0 });
    setCurrentIndex(prev => prev + 1);
  };

  const handleLike = () => {
    swipeRight();
  };

  const handleDislike = () => {
    swipeLeft();
  };

  const handleSuperLike = () => {
    if (myBrumes < BRUMES_COSTS.superlike) {
      Alert.alert(
        '⭐ Brumes insuffisantes',
        `Le Super Like coûte ${BRUMES_COSTS.superlike} brumes.\nVous avez ${myBrumes} brumes.`,
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Acheter des Brumes', onPress: () => router.push('/(tabs)/shop') }
        ]
      );
      return;
    }

    Alert.alert(
      '⭐ Super Like',
      `Envoyer un Super Like à ${currentProfile?.name} ?\nCoût: ${BRUMES_COSTS.superlike} brumes`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Envoyer', 
          onPress: () => {
            setMyBrumes(prev => prev - BRUMES_COSTS.superlike);
            Animated.timing(position, {
              toValue: { x: 0, y: -height },
              duration: 300,
              useNativeDriver: true,
            }).start(() => handleSwipeComplete('superlike'));
          }
        },
      ]
    );
  };

  const handleBoost = () => {
    if (myBrumes < BRUMES_COSTS.boost) {
      Alert.alert(
        '🚀 Brumes insuffisantes',
        `Le Boost coûte ${BRUMES_COSTS.boost} brumes.\nVous avez ${myBrumes} brumes.`,
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Acheter des Brumes', onPress: () => router.push('/(tabs)/shop') }
        ]
      );
      return;
    }

    Alert.alert(
      '🚀 Boost ton profil',
      `Sois visible par 10x plus de personnes pendant 20 minutes.\nCoût: ${BRUMES_COSTS.boost} brumes`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Activer', 
          onPress: () => {
            setMyBrumes(prev => prev - BRUMES_COSTS.boost);
            setIsBoostActive(true);
            Alert.alert('🚀 Boost activé !', 'Ton profil est maintenant mis en avant pendant 20 minutes.');
            // Désactiver après 20 minutes
            setTimeout(() => setIsBoostActive(false), 20 * 60 * 1000);
          }
        },
      ]
    );
  };

  const currentProfile = profiles[currentIndex];
  const nextProfile = profiles[currentIndex + 1];

  if (!currentProfile) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <LinearGradient colors={['#faf9ff', '#f0eeff', '#ffe9f2']} style={StyleSheet.absoluteFill} />
        <SafeAreaView style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>💫</Text>
          <Text style={styles.emptyTitle}>Plus de profils</Text>
          <Text style={styles.emptySubtitle}>Reviens plus tard pour découvrir de nouvelles personnes !</Text>
          <TouchableOpacity 
            style={styles.refreshBtn}
            onPress={() => setCurrentIndex(0)}
          >
            <Text style={styles.refreshBtnText}>Recommencer</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  }

  const BlurOverlay = ({ intensity = 60 }: { intensity?: number }) => (
    Platform.OS === 'web'
      ? <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255,255,255,0.3)' }]} />
      : <BlurView intensity={intensity} tint="light" style={StyleSheet.absoluteFill} />
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Header sticky tout en haut */}
      <SafeAreaView edges={['top']} style={[styles.header, { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee', elevation: 2 }]}> 
        <View style={[styles.headerRow, { minHeight: 60 }]}> 
          <View style={{ flex: 1 }} />
          <Text style={styles.logo}>Flou</Text>
          <View style={styles.headerRight}>
            <View style={styles.brumesContainer}>
              <Text style={styles.brumesIcon}>☁️</Text>
              <Text style={styles.brumesCount}>{myBrumes}</Text>
            </View>
            <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.menuBtn}>
              <Text style={styles.menuIcon}>⚙️</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <StatusBar style="dark" />
          <LinearGradient colors={['#faf9ff', '#f0eeff', '#ffe9f2']} style={StyleSheet.absoluteFill} />
          {/* Cards Stack */}
          <View style={[styles.cardsContainer, { paddingTop: 10, paddingBottom: 120, alignItems: 'center', justifyContent: 'center' }]}> 
            {/* Next Card (behind) */}
            {nextProfile && (
              <View style={[styles.card, styles.cardBehind]}>
                <Image 
                  source={{ uri: nextProfile.photos[0] }} 
                  style={styles.cardImage}
                  blurRadius={20}
                />
                <BlurOverlay intensity={80} />
              </View>
            )}

            {/* Current Card */}
            <Animated.View
              {...panResponder.panHandlers}
              style={[
                styles.card,
                {
                  transform: [
                    { translateX: position.x },
                    { translateY: position.y },
                    { rotate: rotate },
                  ],
                },
              ]}
            >
              {/* LIKE / NOPE labels */}
              <Animated.View style={[styles.likeLabel, { opacity: likeOpacity }]}> 
                <Text style={styles.likeLabelText}>LIKE 💚</Text>
              </Animated.View>
              <Animated.View style={[styles.nopeLabel, { opacity: nopeOpacity }]}> 
                <Text style={styles.nopeLabelText}>NOPE 👋</Text>
              </Animated.View>

              {/* Photo floutée */}
              <Image 
                source={{ uri: currentProfile.photos[0] }} 
                style={styles.cardImage}
                blurRadius={15}
              />
              <BlurOverlay intensity={40} />

              {/* Gradient overlay */}
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.7)']}
                style={styles.cardGradient}
              />

              {/* Content */}
              <View style={styles.cardContent}>
                {/* Badges */}
                <View style={styles.topBadges}>
                  {currentProfile.verified && (
                    <View style={styles.verifiedBadge}>
                      <Text style={styles.verifiedText}>✓ Vérifié</Text>
                    </View>
                  )}
                  <View style={styles.distanceBadge}>
                    <Text style={styles.distanceText}>📍 {currentProfile.distance}</Text>
                  </View>
                </View>

                {/* Info */}
                <View style={styles.cardInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.name}>{currentProfile.name}</Text>
                    <Text style={styles.age}>, {currentProfile.age}</Text>
                  </View>
                  <Text style={styles.city}>{currentProfile.city}</Text>
                  <View style={styles.tagContainer}>
                    <LinearGradient
                      colors={['#667eea', '#764ba2']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.tagGradient}
                    >
                      <Text style={styles.tagText}>{currentProfile.tag}</Text>
                    </LinearGradient>
                  </View>
                  <Text style={styles.bio}>{currentProfile.bio}</Text>
                  <Text style={styles.emojis}>{currentProfile.emojis}</Text>
                  {/* Interests */}
                  <View style={styles.interestsRow}>
                    {currentProfile.interests.slice(0, 3).map((interest, i) => (
                      <View key={i} style={styles.interestChip}>
                        <Text style={styles.interestText}>#{interest}</Text>
                      </View>
                    ))}
                  </View>
                  {/* Icebreakers */}
                  <View style={styles.icebreakersSection}>
                    <Text style={styles.icebreakersTitle}>Icebreakers</Text>
                    <View style={styles.icebreakersRow}>
                      {ICEBREAKERS.map((q, i) => (
                        <TouchableOpacity key={i} style={styles.icebreakerChip}>
                          <Text style={styles.icebreakerText}>{q}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>
              </View>
            </Animated.View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity style={styles.actionBtnSmall} onPress={handleBoost}>
              <Text style={styles.actionBtnSmallIcon}>🚀</Text>
              <View style={styles.brumeCostBadge}>
                <Text style={styles.brumeCostText}>{BRUMES_COSTS.boost}</Text>
              </View>
              {isBoostActive && <View style={styles.boostActiveBadge} />}
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.actionBtn, styles.dislikeBtn]} onPress={handleDislike}>
              <Text style={styles.actionBtnIcon}>✕</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.actionBtn, styles.superlikeBtn]} onPress={handleSuperLike}>
              <Text style={styles.actionBtnIcon}>⭐</Text>
              <View style={styles.brumeCostBadgeLarge}>
                <Text style={styles.brumeCostText}>{BRUMES_COSTS.superlike}</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.actionBtn, styles.likeBtn]} onPress={handleLike}>
              <Text style={styles.actionBtnIcon}>♥</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionBtnSmall}>
              <Text style={styles.actionBtnSmallIcon}>↩️</Text>
            </TouchableOpacity>
          </View>

          {/* Menu Modal */}
          <Modal
            visible={menuVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setMenuVisible(false)}
          >
            <Pressable style={styles.modalOverlay} onPress={() => setMenuVisible(false)}>
              <View style={styles.menuContainer}>
                <TouchableOpacity
                  onPress={() => { setMenuVisible(false); router.push('/settings' as any); }}
                  style={styles.menuItem}
                >
                  <Text style={styles.menuItemIcon}>⚙️</Text>
                  <Text style={styles.menuItemText}>Paramètres</Text>
                </TouchableOpacity>
                <View style={styles.menuDivider} />
                <TouchableOpacity
                  onPress={() => { setMenuVisible(false); router.push('/settings/edit-profile' as any); }}
                  style={styles.menuItem}
                >
                  <Text style={styles.menuItemIcon}>✏️</Text>
                  <Text style={styles.menuItemText}>Éditer mon profil</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => { setMenuVisible(false); router.push('/shop' as any); }}
                  style={styles.menuItem}
                >
                  <Text style={styles.menuItemIcon}>💎</Text>
                  <Text style={styles.menuItemText}>Abonnement & Brumes</Text>
                </TouchableOpacity>
                <View style={styles.menuDivider} />
                <TouchableOpacity
                  onPress={() => { setMenuVisible(false); router.push('/settings/support' as any); }}
                  style={styles.menuItem}
                >
                  <Text style={styles.menuItemIcon}>🆘</Text>
                  <Text style={styles.menuItemText}>Aide & Support</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Modal>

          {/* Match Modal */}
          <Modal
            visible={matchModal}
            transparent
            animationType="fade"
            onRequestClose={() => setMatchModal(false)}
          >
            <View style={styles.matchOverlay}>
              <LinearGradient
                colors={['#667eea', '#764ba2', '#f093fb']}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.matchContent}>
                <Text style={styles.matchEmoji}>💕</Text>
                <Text style={styles.matchTitle}>C&apos;est un Match !</Text>
                <Text style={styles.matchSubtitle}>
                  Toi et {matchedProfile?.name} vous êtes likés mutuellement
                </Text>
                
                <View style={styles.matchAvatars}>
                  <View style={styles.matchAvatar}>
                    <Text style={styles.matchAvatarText}>Toi</Text>
                  </View>
                  <Text style={styles.matchHeart}>💜</Text>
                  <View style={styles.matchAvatar}>
                    <Image 
                      source={{ uri: matchedProfile?.photos[0] }} 
                      style={styles.matchAvatarImage}
                      blurRadius={10}
                    />
                  </View>
                </View>

                <TouchableOpacity 
                  style={styles.matchBtn}
                  onPress={() => { setMatchModal(false); router.push('/messages' as any); }}
                >
                  <LinearGradient
                    colors={['#fff', '#fff']}
                    style={styles.matchBtnGradient}
                  >
                    <Text style={styles.matchBtnText}>Envoyer un message</Text>
                  </LinearGradient>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.matchBtnSecondary}
                  onPress={() => setMatchModal(false)}
                >
                  <Text style={styles.matchBtnSecondaryText}>Continuer à swiper</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {/* Daily Reward Modal */}
          <Modal
            visible={showDailyReward}
            transparent
            animationType="fade"
            onRequestClose={() => setShowDailyReward(false)}
          >
            <View style={styles.dailyRewardOverlay}>
              <View style={styles.dailyRewardContent}>
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.dailyRewardGradient}
                >
                  <Text style={styles.dailyRewardEmoji}>🎁</Text>
                  <Text style={styles.dailyRewardTitle}>Récompense quotidienne</Text>
                  <Text style={styles.dailyRewardSubtitle}>
                    Jour {consecutiveDays} de connexion
                  </Text>
                  
                  {/* Reward Display */}
                  <View style={styles.dailyRewardBox}>
                    <Text style={styles.dailyRewardIcon}>☁️</Text>
                    <Text style={styles.dailyRewardAmount}>+5</Text>
                    <Text style={styles.dailyRewardLabel}>Brumes</Text>
                  </View>

                  {/* 10 days progress */}
                  <View style={styles.dailyProgressContainer}>
                    <Text style={styles.dailyProgressTitle}>Bonus 10ème jour: +10 ☁️</Text>
                    <View style={styles.dailyProgressBar}>
                      {[...Array(10)].map((_, i) => (
                        <View 
                          key={i} 
                          style={[
                            styles.dailyProgressDot,
                            i < (consecutiveDays % 10) && styles.dailyProgressDotActive,
                            i === 9 && styles.dailyProgressDotBonus
                          ]}
                        >
                          {i === 9 && <Text style={styles.dailyProgressBonusIcon}>🎉</Text>}
                        </View>
                      ))}
                    </View>
                    <Text style={styles.dailyProgressText}>
                      {10 - (consecutiveDays % 10 === 0 ? 10 : consecutiveDays % 10)} jours avant le bonus
                    </Text>
                  </View>

                  <TouchableOpacity 
                    style={styles.dailyRewardBtn}
                    onPress={claimDailyReward}
                  >
                    <Text style={styles.dailyRewardBtnText}>Récupérer mes Brumes</Text>
                  </TouchableOpacity>
                </LinearGradient>
              </View>
            </View>
          </Modal>

          {/* Ajout d'un indicateur de chargement */}
          {loading && (
            <ActivityIndicator size="large" color="#667eea" style={{ marginTop: 40 }} />
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#faf9ff',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    backgroundColor: 'transparent',
    zIndex: 10,
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  logo: {
    fontSize: 32,
    fontWeight: '900',
    color: '#667eea',
    letterSpacing: 1.5,
    textAlign: 'center',
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brumesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(102,126,234,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  brumesIcon: {
    fontSize: 16,
  },
  brumesCount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#667eea',
  },
  menuBtn: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(102,126,234,0.2)',
  },
  menuIcon: {
    fontSize: 20,
  },

  // Cards
  cardsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 120,
    paddingTop: 10,
  },
  card: {
    width: width * 0.88,
    height: height * 0.58,
    borderRadius: 24,
    backgroundColor: '#fff',
    overflow: 'hidden',
    position: 'absolute',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  cardBehind: {
    transform: [{ scale: 0.95 }],
    opacity: 0.5,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  cardContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },

  // Labels
  likeLabel: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    transform: [{ rotate: '-20deg' }],
  },
  likeLabelText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
  },
  nopeLabel: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    backgroundColor: '#f44336',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    transform: [{ rotate: '20deg' }],
  },
  nopeLabelText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
  },

  // Badges
  topBadges: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  verifiedBadge: {
    backgroundColor: 'rgba(76,175,80,0.9)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verifiedText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  distanceBadge: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  distanceText: {
    color: '#333',
    fontSize: 12,
    fontWeight: '600',
  },

  // Info
  cardInfo: {
    gap: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  name: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
  },
  age: {
    fontSize: 24,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },
  city: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  tagContainer: {
    alignSelf: 'flex-start',
  },
  tagGradient: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
  },
  tagText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  bio: {
    fontSize: 15,
    color: '#fff',
    lineHeight: 22,
    marginTop: 4,
  },
  emojis: {
    fontSize: 20,
  },

  // Interests
  interestsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  interestChip: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  interestText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },

  // Icebreakers
  icebreakersSection: {
    marginTop: 12,
  },
  icebreakersTitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  icebreakersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  icebreakerChip: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  icebreakerText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },

  // Actions
  actionsContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
  },
  actionBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  actionBtnSmall: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  actionBtnSmallIcon: {
    fontSize: 18,
  },
  dislikeBtn: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#f44336',
  },
  likeBtn: {
    backgroundColor: '#4CAF50',
  },
  superlikeBtn: {
    backgroundColor: '#2196F3',
  },
  actionBtnIcon: {
    fontSize: 28,
    color: '#fff',
  },

  // Menu Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  menuContainer: {
    position: 'absolute',
    top: 100,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 8,
    minWidth: 240,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  menuItemIcon: {
    fontSize: 20,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 4,
  },

  // Match Modal
  matchOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchContent: {
    alignItems: 'center',
    padding: 40,
  },
  matchEmoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  matchTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 10,
  },
  matchSubtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 30,
  },
  matchAvatars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginBottom: 40,
  },
  matchAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    overflow: 'hidden',
  },
  matchAvatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  matchAvatarImage: {
    width: '100%',
    height: '100%',
  },
  matchHeart: {
    fontSize: 40,
  },
  matchBtn: {
    width: '100%',
    marginBottom: 16,
  },
  matchBtnGradient: {
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  matchBtnText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#667eea',
  },
  matchBtnSecondary: {
    paddingVertical: 12,
  },
  matchBtnSecondaryText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    fontWeight: '600',
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#333',
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  refreshBtn: {
    backgroundColor: '#667eea',
    paddingHorizontal: 30,
    paddingVertical: 14,
    borderRadius: 25,
  },
  refreshBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  // Brumes badges
  brumeCostBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#667eea',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  brumeCostBadgeLarge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#667eea',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    minWidth: 28,
    alignItems: 'center',
  },
  brumeCostText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fff',
  },
  boostActiveBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10b981',
    borderWidth: 2,
    borderColor: '#fff',
  },
  brumesFloating: {
    position: 'absolute',
    top: 120,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    gap: 4,
  },
  brumesFloatingIcon: {
    fontSize: 14,
  },
  brumesFloatingText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#667eea',
  },

  // Daily Reward Modal
  dailyRewardOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dailyRewardContent: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  dailyRewardGradient: {
    padding: 28,
    alignItems: 'center',
  },
  dailyRewardEmoji: {
    fontSize: 60,
    marginBottom: 16,
  },
  dailyRewardTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
  },
  dailyRewardSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 24,
  },
  dailyRewardBox: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 40,
    alignItems: 'center',
    marginBottom: 24,
  },
  dailyRewardIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  dailyRewardAmount: {
    fontSize: 48,
    fontWeight: '900',
    color: '#fff',
  },
  dailyRewardLabel: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
  },
  dailyProgressContainer: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  dailyProgressTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  dailyProgressBar: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  dailyProgressDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dailyProgressDotActive: {
    backgroundColor: '#fff',
  },
  dailyProgressDotBonus: {
    backgroundColor: '#fbbf24',
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  dailyProgressBonusIcon: {
    fontSize: 12,
  },
  dailyProgressText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  dailyRewardBtn: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
  },
  dailyRewardBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#667eea',
  },

  // ScrollView
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
