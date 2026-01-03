// LiveKit integration
import { Audio } from 'expo-av';
import { BlurView } from 'expo-blur';
import { useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Dimensions, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
let LiveKitRoom: any, useTracks: any, VideoTrack: any;
if (Platform.OS !== 'web') {
  // @ts-ignore
  ({ LiveKitRoom, useTracks, VideoTrack } = require('@livekit/react-native'));
}
// Composant pour afficher tous les flux vidéo des participants
function VideoTracks() {
  if (Platform.OS === 'web') {
    return null;
  }
  const tracks = useTracks();
  return (
    <>
      {tracks.map((ref: any) =>
        ref.publication && ref.publication.kind === 'video' ? (
          <VideoTrack
            key={ref.publication.trackSid}
            trackRef={ref}
            style={{ width: 80, height: 80, borderRadius: 16, margin: 4 }}
          />
        ) : null
      )}
    </>
  );
}
// LiveKit integration
// import { LiveKitRoom, useTracks, VideoTrack } from '@livekit/react-native';
// VideoTracks component for rendering all video tracks in the room
// function VideoTracks() {
//   const tracks = useTracks();
//   return (
//     <>
//       {tracks.map((ref) =>
//         ref.publication && ref.publication.kind === 'video' ? (
//           <VideoTrack
//             key={ref.publication.trackSid}
//             trackRef={ref}
//             style={{ width: 80, height: 80, borderRadius: 16, margin: 4 }}
//           />
//         ) : null
//       )}
//     </>
//   );
// }
// LiveKit server URL and API key
const LIVEKIT_URL = 'wss://flouapp-mejnaydh.livekit.cloud';
// Le token sera généré dynamiquement
// Fonction utilitaire pour récupérer un token LiveKit depuis une API
async function fetchLiveKitToken(room: string, user: string): Promise<string> {
  // À adapter avec l’URL de ton backend ou service de génération de token
  const url = `https://YOUR_BACKEND_URL/api/livekit-token?room=${encodeURIComponent(room)}&user=${encodeURIComponent(user)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Erreur lors de la récupération du token LiveKit');
  const data = await res.json();
  return data.token;
}

const { width, height } = Dimensions.get('window');

// 10 Questions Versus pour Live Date
const VERSUS_QUESTIONS = [
  { id: 1, emoji: '✈️', question: 'Destination de rêve ?', suggestions: ['Ibiza', 'Paris'] },
  { id: 2, emoji: '🌊', question: 'Vacances idéales ?', suggestions: ['Mer', 'Montagne'] },
  { id: 3, emoji: '🍕', question: 'Cuisine préférée ?', suggestions: ['Italien', 'Japonais'] },
  { id: 4, emoji: '🎬', question: 'Soirée parfaite ?', suggestions: ['Netflix', 'Sortie'] },
  { id: 5, emoji: '🐕', question: 'Animal de compagnie ?', suggestions: ['Chien', 'Chat'] },
  { id: 6, emoji: '☀️', question: 'Moment préféré ?', suggestions: ['Matin', 'Soir'] },
  { id: 7, emoji: '🎵', question: 'Style musical ?', suggestions: ['Pop', 'Rap'] },
  { id: 8, emoji: '💪', question: 'Activité weekend ?', suggestions: ['Sport', 'Repos'] },
  { id: 9, emoji: '🍷', question: 'Boisson favorite ?', suggestions: ['Vin', 'Cocktail'] },
  { id: 10, emoji: '💑', question: 'Premier rendez-vous ?', suggestions: ['Restaurant', 'Balade'] },
];

// (Suppression des emojis spectateurs)
const SPECTATOR_EMOJIS: string[] = [];

// Hook pour récupérer dynamiquement les rooms actives depuis Supabase
function useLiveRooms() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string|null>(null);
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    supabase
      .from('live_rooms')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error) setError(error.message);
        else setRooms(data || []);
        setLoading(false);
      });
    return () => { mounted = false; };
  }, []);
  return { rooms, loading, error };
}

// Minimum de réponses communes pour matcher
const MIN_COMMON_ANSWERS = 6;

export default function LiveScreen() {
  // LiveKit room state
  const [activeTab, setActiveTab] = useState<'groupe' | 'date'>('groupe');
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'front' | 'back'>('front');
  const [micGranted, setMicGranted] = useState(false);
  // Récupère les rooms dynamiquement
  const { rooms: LIVE_ROOMS, loading: loadingRooms, error: errorRooms } = useLiveRooms();

  // Demande permission micro au montage
  useEffect(() => {
    (async () => {
      const { status } = await Audio.requestPermissionsAsync();
      setMicGranted(status === 'granted');
    })();
  }, []);
  // Fonction pour activer la caméra
  const handleStartCamera = async () => {
    const { status } = await requestCameraPermission();
      if (status === 'granted') {
        setCameraOn(true);
      }
    };
  const [showStartModal, setShowStartModal] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [myAnswers, setMyAnswers] = useState<Record<number, number>>({});
  const [partnerAnswers, setPartnerAnswers] = useState<Record<number, number>>({});
  const [matchResult, setMatchResult] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [spectatorEmojis, setSpectatorEmojis] = useState<Array<{ id: number; emoji: string; x: number }>>([]);
  const [spectatorCount, setSpectatorCount] = useState(156);
  const [waitingForPartner, setWaitingForPartner] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const emojiIdRef = useRef(0);

  // Suppression de la simulation des emojis spectateurs
  useEffect(() => {
    if (showDateModal) {
      const interval = setInterval(() => {
        if (Math.random() > 0.5) {
          const newEmoji = {
            id: emojiIdRef.current++,
            emoji: SPECTATOR_EMOJIS[Math.floor(Math.random() * SPECTATOR_EMOJIS.length)],
            x: 20 + Math.random() * (width - 80),
          };
          setSpectatorEmojis(prev => [...prev.slice(-15), newEmoji]);
        }
      }, 600);
      return () => clearInterval(interval);
    }
  }, [showDateModal]);

  // Simuler les réponses du partenaire (délai aléatoire)
  useEffect(() => {
    if (showDateModal && currentQuestion < 10 && !showResult) {
      const timer = setTimeout(() => {
        setPartnerAnswers(prev => ({
          ...prev,
          [currentQuestion]: Math.random() > 0.5 ? 0 : 1
        }));
      }, 1000 + Math.random() * 2000);
      return () => clearTimeout(timer);
    }
  }, [currentQuestion, showDateModal, showResult]);

  // Simuler les emojis des spectateurs
  useEffect(() => {
    if (showDateModal) {
      const interval = setInterval(() => {
        if (Math.random() > 0.5) {
          const newEmoji = {
            id: emojiIdRef.current++,
            emoji: SPECTATOR_EMOJIS[Math.floor(Math.random() * SPECTATOR_EMOJIS.length)],
            x: 20 + Math.random() * (width - 80),
          };
          setSpectatorEmojis(prev => [...prev.slice(-15), newEmoji]);
        }
      }, 600);
      return () => clearInterval(interval);
    }
  }, [showDateModal]);

  // Vérifier si les deux ont répondu pour passer à la question suivante
  useEffect(() => {
    if (myAnswers[currentQuestion] !== undefined && partnerAnswers[currentQuestion] !== undefined) {
      setWaitingForPartner(false);
      
      // Passer à la question suivante après un court délai
      const timer = setTimeout(() => {
        if (currentQuestion < 9) {
          setCurrentQuestion(prev => prev + 1);
        } else {
          // Toutes les questions répondues, calculer le résultat
          calculateMatch();
        }
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [myAnswers, partnerAnswers, currentQuestion]);

  const selectAnswer = (questionId: number, answerIdx: number) => {
    if (myAnswers[questionId] !== undefined) return; // Déjà répondu
    
    setMyAnswers(prev => ({ ...prev, [questionId]: answerIdx }));
    setWaitingForPartner(true);
  };

  const calculateMatch = () => {
    let commonAnswers = 0;
    for (let i = 0; i < 10; i++) {
      if (myAnswers[i] === partnerAnswers[i]) {
        commonAnswers++;
      }
    }
    setMatchResult(commonAnswers);
    setShowResult(true);
  };

  const resetDateMode = () => {
    setCurrentQuestion(0);
    setMyAnswers({});
    setPartnerAnswers({});
    setMatchResult(null);
    setShowResult(false);
    setSpectatorEmojis([]);
    setWaitingForPartner(false);
  };

  const sendSpectatorEmoji = (emoji: string) => {
    // Suppression de l'envoi d'emojis spectateurs
  };

  const filteredRooms = LIVE_ROOMS.filter(room => room.type === activeTab);

  const renderLiveCard = (room: typeof LIVE_ROOMS[0]) => (
    <TouchableOpacity
      key={room.id}
      style={styles.liveCard}
      onPress={() => router.push('/live-room')}
      activeOpacity={0.9}
    >
      <LinearGradient
        colors={room.type === 'date' ? ['#ec4899', '#8b5cf6'] : ['#667eea', '#764ba2']}
        style={styles.liveCardGradient}
      >
        {/* Badge Live */}
        <View style={styles.liveBadge}>
          <View style={styles.liveIndicator} />
          <Text style={styles.liveBadgeText}>LIVE</Text>
        </View>

        {/* Viewers */}
        <View style={styles.viewersBadge}>
          <Text style={styles.viewersIcon}>👁</Text>
          <Text style={styles.viewersText}>{room.viewers.toLocaleString()}</Text>
        </View>

        {/* Avatar central */}
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarEmoji}>{room.avatar}</Text>
        </View>

        {/* Infos */}
        <View style={styles.liveCardInfo}>
          <Text style={styles.liveUsername}>{room.username}</Text>
          <View style={styles.tagsRow}>
            {room.tags.map((tag: string, idx: number) => (
              <View key={idx} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  // Calculer combien de réponses sont déjà communes
  const getCurrentCommonCount = () => {
    let count = 0;
    for (let i = 0; i <= currentQuestion; i++) {
      if (myAnswers[i] !== undefined && partnerAnswers[i] !== undefined && myAnswers[i] === partnerAnswers[i]) {
        count++;
      }
    }
    return count;
  };

  return (
    <View style={[styles.container, { backgroundColor: '#faf9ff' }]}> 
      <BlurView intensity={60} tint="light" style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={["#faf9ff", "#f0eeff", "#ffe9f2"]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>🎥 Live</Text>
            <TouchableOpacity style={styles.searchBtn}>
              <Text style={styles.searchIcon}>🔍</Text>
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'groupe' && styles.tabActive]}
              onPress={() => setActiveTab('groupe')}
            >
              <Text style={[styles.tabText, activeTab === 'groupe' && styles.tabTextActive]}>
                👥 Live Groupe
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'date' && styles.tabActive]}
              onPress={() => setActiveTab('date')}
            >
              <Text style={[styles.tabText, activeTab === 'date' && styles.tabTextActive]}>
                💕 Live Date
              </Text>
            </TouchableOpacity>
          </View>

          {/* Description du mode */}
          <View style={styles.modeDescription}>
            {activeTab === 'groupe' ? (
              <Text style={styles.modeDescText}>
                🎤 Diffuse en direct et interagis avec ta communauté
              </Text>
            ) : (
              <Text style={styles.modeDescText}>
                💘 Réponds aux 10 questions Versus. Minimum {MIN_COMMON_ANSWERS} réponses communes pour matcher !
              </Text>
            )}
          </View>

          {/* Lives en cours */}
          {loadingRooms && <ActivityIndicator color="#667eea" style={{ margin: 20 }} />}
          {errorRooms && <Text style={{ color: 'red', margin: 20 }}>{errorRooms}</Text>}
          {filteredRooms
            .map(room => renderLiveCard(room))}
          {Platform.OS === 'web' && (
            <View style={{ alignItems: 'center', margin: 32 }}>
              <Text style={{ color: '#888', fontSize: 16, textAlign: 'center' }}>
                Le live vidéo n'est disponible que sur l'application mobile (Android/iOS).
              </Text>
            </View>
          )}

        </View>
      </SafeAreaView>

      {/* Modal Start Live Groupe */}
      <Modal visible={showStartModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <BlurView intensity={20} style={StyleSheet.absoluteFill} />
          <View style={styles.modalContent}>
            <LinearGradient
              colors={['#1a1a2e', '#16213e']}
              style={styles.modalGradient}
            >
              <Text style={styles.modalTitle}>🎥 Prêt à diffuser ?</Text>
              <Text style={styles.modalSubtitle}>
                Lance ton live et connecte-toi avec ta communauté
              </Text>

              <View style={styles.modalFeatures}>
                <View style={styles.modalFeature}>
                  <Text style={styles.featureIcon}>💬</Text>
                  <Text style={styles.featureText}>Chat en direct</Text>
                </View>
                <View style={styles.modalFeature}>
                  <Text style={styles.featureIcon}>🎁</Text>
                  <Text style={styles.featureText}>Reçois des Brumes</Text>
                </View>
                <View style={styles.modalFeature}>
                  <Text style={styles.featureIcon}>👥</Text>
                  <Text style={styles.featureText}>Invités multiples</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.startLiveBtn}
                onPress={() => {
                  setShowStartModal(false);
                  router.push('/live-room');
                }}
              >
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  style={styles.startLiveBtnGradient}
                >
                  <Text style={styles.startLiveBtnText}>🔴 Démarrer le Live</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowStartModal(false)}
              >
                <Text style={styles.cancelBtnText}>Annuler</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </View>
      </Modal>

      {/* Modal Live Date - Versus Q&A */}
      <Modal visible={showDateModal} animationType="fade" transparent>
        <View style={styles.dateModalOverlay}>
          <LinearGradient
            colors={['#0f0c29', '#302b63', '#24243e']}
            style={StyleSheet.absoluteFill}
          />

          {/* Emojis des spectateurs flottants */}
          {/* Suppression des emojis spectateurs flottants */}

          <SafeAreaView style={styles.dateModalContent}>
            {/* Header Date Modal */}
            <View style={styles.dateHeader}>
              <TouchableOpacity 
                onPress={() => {
                  setShowDateModal(false);
                  resetDateMode();
                }}
                style={styles.closeBtn}
              >
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
              
              <View style={styles.dateHeaderCenter}>
                <Text style={styles.dateHeaderTitle}>💕 Live Date</Text>
                <View style={styles.spectatorBadge}>
                  <Text style={styles.spectatorIcon}>👁</Text>
                  <Text style={styles.spectatorCount}>{spectatorCount} spectateurs</Text>
                </View>
              </View>
              
              <View style={styles.questionProgress}>
                <Text style={styles.progressText}>{currentQuestion + 1}/10</Text>
              </View>
            </View>

            {/* Barre de progression */}
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${((currentQuestion + 1) / 10) * 100}%` }]} />
            </View>

            {/* Compteur de réponses communes */}
            <View style={styles.commonCountBadge}>
              <Text style={styles.commonCountText}>
                💕 {getCurrentCommonCount()} réponses communes • Objectif: {MIN_COMMON_ANSWERS}/10
              </Text>
            </View>

            {!showResult ? (
              <>
                {/* Zone des participants */}
                <View style={styles.participantsZone}>
                  <View style={styles.participant}>
                    <LinearGradient
                      colors={['#667eea', '#764ba2']}
                      style={styles.participantAvatar}
                    >
                      <Text style={styles.participantEmoji}>👩</Text>
                    </LinearGradient>
                    <Text style={styles.participantName}>Toi</Text>
                    {myAnswers[currentQuestion] !== undefined && (
                      <View style={styles.answeredBadge}>
                        <Text style={styles.answeredText}>✓</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.vsContainer}>
                    <Text style={styles.vsText}>VS</Text>
                  </View>

                  <View style={styles.participant}>
                    <LinearGradient
                      colors={['#ec4899', '#8b5cf6']}
                      style={styles.participantAvatar}
                    >
                      <Text style={styles.participantEmoji}>👨</Text>
                    </LinearGradient>
                    <Text style={styles.participantName}>Alex_music</Text>
                    {partnerAnswers[currentQuestion] !== undefined && (
                      <View style={styles.answeredBadge}>
                        <Text style={styles.answeredText}>✓</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Question actuelle */}
                <View style={styles.questionContainer}>
                  <Text style={styles.questionEmoji}>
                    {VERSUS_QUESTIONS[currentQuestion].emoji}
                  </Text>
                  <Text style={styles.questionText}>
                    {VERSUS_QUESTIONS[currentQuestion].question}
                  </Text>

                  {/* Suggestions */}
                  <View style={styles.suggestionsRow}>
                    {VERSUS_QUESTIONS[currentQuestion].suggestions.map((suggestion, idx) => {
                      const isSelected = myAnswers[currentQuestion] === idx;
                      const isDisabled = myAnswers[currentQuestion] !== undefined;
                      return (
                        <TouchableOpacity
                          key={idx}
                          style={[
                            styles.suggestionBtn,
                            isSelected && styles.suggestionBtnSelected,
                            isDisabled && !isSelected && styles.suggestionBtnDisabled
                          ]}
                          onPress={() => selectAnswer(currentQuestion, idx)}
                          activeOpacity={isDisabled ? 1 : 0.8}
                          disabled={isDisabled}
                        >
                          <Text style={[
                            styles.suggestionText,
                            isSelected && styles.suggestionTextSelected
                          ]}>
                            {suggestion}
                          </Text>
                          {isSelected && <Text style={styles.checkIcon}>✓</Text>}
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Message d'attente */}
                  {waitingForPartner && (
                    <View style={styles.waitingContainer}>
                      <Text style={styles.waitingText}>⏳ En attente de la réponse de ton partenaire...</Text>
                    </View>
                  )}
                </View>

                {/* Zone spectateurs - Emojis */}
                {/* Suppression de la zone spectateurs emojis */}
              </>
            ) : (
              /* Résultat du match */
              <View style={styles.resultContainer}>
                <LinearGradient
                  colors={matchResult !== null && matchResult >= MIN_COMMON_ANSWERS 
                    ? ['#10b981', '#059669'] 
                    : ['#ef4444', '#dc2626']}
                  style={styles.resultGradient}
                >
                  <Text style={styles.resultEmoji}>
                    {matchResult !== null && matchResult >= MIN_COMMON_ANSWERS ? '💕' : '💔'}
                  </Text>
                  <Text style={styles.resultTitle}>
                    {matchResult !== null && matchResult >= MIN_COMMON_ANSWERS ? 'C\'est un Match !' : 'Pas de match...'}
                  </Text>
                  <Text style={styles.resultScore}>
                    {matchResult}/10 réponses communes
                  </Text>
                  <Text style={styles.resultSubtitle}>
                    {matchResult !== null && matchResult >= MIN_COMMON_ANSWERS 
                      ? `🎉 Vous avez ${matchResult} réponses en commun ! Vous pouvez continuer à discuter.` 
                      : `😢 Il faut minimum ${MIN_COMMON_ANSWERS} réponses communes pour matcher. Retente ta chance !`}
                  </Text>

                  {/* Récapitulatif des réponses */}
                  <View style={styles.answersRecap}>
                    <Text style={styles.answersRecapTitle}>📊 Récapitulatif</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={styles.answersRecapRow}>
                        {VERSUS_QUESTIONS.map((q, idx) => {
                          const isMatch = myAnswers[idx] === partnerAnswers[idx];
                          return (
                            <View key={idx} style={[styles.recapItem, isMatch && styles.recapItemMatch]}>
                              <Text style={styles.recapEmoji}>{q.emoji}</Text>
                              <Text style={styles.recapStatus}>{isMatch ? '✓' : '✗'}</Text>
                            </View>
                          );
                        })}
                      </View>
                    </ScrollView>
                  </View>

                  {matchResult !== null && matchResult >= MIN_COMMON_ANSWERS && (
                    <TouchableOpacity style={styles.chatBtn}>
                      <Text style={styles.chatBtnText}>💬 Démarrer le chat</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={styles.retryBtn}
                    onPress={() => {
                      resetDateMode();
                      if (matchResult !== null && matchResult < MIN_COMMON_ANSWERS) {
                        // Reste dans le modal pour réessayer
                      } else {
                        setShowDateModal(false);
                      }
                    }}
                  >
                    <Text style={styles.retryBtnText}>
                      {matchResult !== null && matchResult >= MIN_COMMON_ANSWERS ? 'Fermer' : '🔄 Réessayer'}
                    </Text>
                  </TouchableOpacity>
                </LinearGradient>
              </View>
            )}
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}

// Composant pour les emojis flottants des spectateurs
// Suppression du composant FloatingEmoji

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#faf9ff',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
  },
  searchBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchIcon: {
    fontSize: 20,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  tabActive: {
    backgroundColor: 'rgba(102, 126, 234, 0.5)',
  },
  tabText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 15,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  modeDescription: {
    marginHorizontal: 20,
    marginTop: 16,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
  },
  modeDescText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },
  livesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  liveCard: {
    width: (width - 52) / 2,
    height: 200,
    borderRadius: 20,
    overflow: 'hidden',
  },
  liveCardGradient: {
    flex: 1,
    padding: 12,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  liveIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  liveBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  viewersBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 3,
  },
  viewersIcon: {
    fontSize: 10,
  },
  viewersText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  avatarContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 60,
  },
  liveCardInfo: {
    gap: 6,
  },
  liveUsername: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  tag: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtext: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
  },
  goLiveContainer: {
    position: 'absolute',
    bottom: 110,
    left: 20,
    right: 20,
  },
  goLiveBtn: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  goLiveGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  goLiveIcon: {
    fontSize: 24,
  },
  goLiveText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: 'hidden',
  },
  modalGradient: {
    padding: 30,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginBottom: 30,
  },
  modalFeatures: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 30,
  },
  modalFeature: {
    alignItems: 'center',
    gap: 8,
  },
  featureIcon: {
    fontSize: 32,
  },
  featureText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  startLiveBtn: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  startLiveBtnGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  startLiveBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
  },
  cancelBtn: {
    paddingVertical: 12,
  },
  cancelBtnText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 15,
  },

  // Date Modal
  dateModalOverlay: {
    flex: 1,
  },
  dateModalContent: {
    flex: 1,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  dateHeaderCenter: {
    alignItems: 'center',
  },
  dateHeaderTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
  },
  spectatorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  spectatorIcon: {
    fontSize: 12,
  },
  spectatorCount: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  questionProgress: {
    backgroundColor: 'rgba(102, 126, 234, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  progressText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 20,
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#667eea',
    borderRadius: 2,
  },
  commonCountBadge: {
    alignSelf: 'center',
    backgroundColor: 'rgba(236, 72, 153, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(236, 72, 153, 0.4)',
  },
  commonCountText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  participantsZone: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 20,
  },
  participant: {
    alignItems: 'center',
    gap: 8,
  },
  participantAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  participantEmoji: {
    fontSize: 40,
  },
  participantName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  answeredBadge: {
    position: 'absolute',
    top: 0,
    right: -5,
    backgroundColor: '#10b981',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  answeredText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  vsContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  vsText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  questionContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  questionEmoji: {
    fontSize: 60,
    marginBottom: 16,
  },
  questionText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 24,
  },
  suggestionsRow: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
  },
  suggestionBtn: {
    flex: 1,
    backgroundColor: 'rgba(102, 126, 234, 0.3)',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(102, 126, 234, 0.5)',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  suggestionBtnSelected: {
    backgroundColor: 'rgba(16, 185, 129, 0.5)',
    borderColor: '#10b981',
  },
  suggestionBtnDisabled: {
    opacity: 0.4,
  },
  suggestionText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  suggestionTextSelected: {
    fontWeight: '800',
  },
  checkIcon: {
    color: '#10b981',
    fontSize: 18,
    fontWeight: '800',
  },
  waitingContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
  },
  waitingText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    textAlign: 'center',
  },

  // Zone spectateurs
  spectatorZone: {
    marginHorizontal: 20,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    alignItems: 'center',
  },
  spectatorZoneTitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  spectatorEmojisRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  spectatorEmojiBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spectatorEmojiText: {
    fontSize: 22,
  },

  // Floating emojis
  floatingEmoji: {
    position: 'absolute',
    bottom: 200,
    zIndex: 100,
  },
  floatingEmojiText: {
    fontSize: 30,
  },

  // Result
  resultContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  resultGradient: {
    borderRadius: 30,
    padding: 30,
    alignItems: 'center',
  },
  resultEmoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  resultTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 12,
  },
  resultScore: {
    fontSize: 24,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 16,
  },
  resultSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  answersRecap: {
    width: '100%',
    marginBottom: 20,
  },
  answersRecapTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  answersRecapRow: {
    flexDirection: 'row',
    gap: 8,
  },
  recapItem: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recapItemMatch: {
    backgroundColor: 'rgba(16, 185, 129, 0.3)',
    borderWidth: 1,
    borderColor: '#10b981',
  },
  recapEmoji: {
    fontSize: 20,
  },
  recapStatus: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '800',
    marginTop: 2,
  },
  chatBtn: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 16,
    marginBottom: 16,
  },
  chatBtnText: {
    color: '#10b981',
    fontSize: 17,
    fontWeight: '800',
  },
  retryBtn: {
    paddingVertical: 12,
  },
  retryBtnText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    fontWeight: '600',
  },
});
