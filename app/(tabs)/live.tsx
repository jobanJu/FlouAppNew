import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useLiveKit } from '@/hooks/useLiveKit';
import GlassCard from '@/components/GlassCard';
import theme from '@/constants/theme';

const { width } = Dimensions.get('window');

/**
 * LiveScreen - Onglet Live
 * Affiche les lives actifs et permet de créer/rejoindre des salles
 * Design FLOU : minimaliste, glassmorphism
 */
export default function LiveScreen() {
  const router = useRouter();
  const { createLiveRoom, loading: liveKitLoading } = useLiveKit();
  const [activeLives, setActiveLives] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadActiveLives();
  }, []);

  const loadActiveLives = async () => {
    setLoading(true);
    // Données de test
    setActiveLives([
      {
        id: '1',
        hostName: 'Emma',
        hostAge: 24,
        question: 'Quel endroit du monde t\'a le plus marqué ?',
        participantCount: 5,
        createdAt: new Date(),
        roomName: 'live-emma-1704326400000',
      },
      {
        id: '2',
        hostName: 'Léa',
        hostAge: 26,
        question: 'Qu\'est-ce que tu cherches vraiment ?',
        participantCount: 3,
        createdAt: new Date(),
        roomName: 'live-lea-1704326400000',
      },
      {
        id: '3',
        hostName: 'Sophie',
        hostAge: 25,
        question: 'Quel moment de la journée t\'énergise le plus ?',
        participantCount: 7,
        createdAt: new Date(),
        roomName: 'live-sophie-1704326400000',
      },
    ]);
    setLoading(false);
  };

  const handleCreateLive = async () => {
    setLoading(true);
    try {
      const config = await createLiveRoom('user_001', 'Alex');
      if (config) {
        router.push({
          pathname: '/live-room',
          params: {
            roomName: config.roomName,
            isHost: 'true',
          },
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleJoinLive = (roomName: string) => {
    router.push({
      pathname: '/live-room',
      params: {
        roomName,
        isHost: 'false',
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>● Lives en direct</Text>
          <Text style={styles.headerSubtitle}>Connexions émotionnelles</Text>
        </View>

        {/* Bouton Créer un Live - Prioritaire */}
        <TouchableOpacity
          style={styles.createLiveBtn}
          onPress={handleCreateLive}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Text style={styles.createLiveIcon}>🔴</Text>
          <View style={styles.createLiveContent}>
            <Text style={styles.createLiveTitle}>Lancer un Live</Text>
            <Text style={styles.createLiveSubtitle}>
              {loading ? 'Préparation...' : 'Connecte-toi en direct'}
            </Text>
          </View>
          {loading && <ActivityIndicator color="#fff" size="small" />}
        </TouchableOpacity>

        {/* Lives actifs */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Lives actifs · {activeLives.length}
            </Text>
            <TouchableOpacity onPress={loadActiveLives}>
              <Text style={styles.refreshBtn}>↻</Text>
            </TouchableOpacity>
          </View>

          {loading && activeLives.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={theme.colors.primary} />
              <Text style={styles.loadingText}>Chargement des lives...</Text>
            </View>
          ) : activeLives.length > 0 ? (
            <View style={styles.livesList}>
              {activeLives.map((live) => (
                <GlassCard
                  key={live.id}
                  style={styles.liveCard}
                  intensity={30}
                  rounded
                >
                  <TouchableOpacity
                    style={styles.liveCardTouchable}
                    onPress={() => handleJoinLive(live.roomName)}
                    activeOpacity={0.7}
                  >
                    {/* Indicateur Live */}
                    <View style={styles.liveIndicator}>
                      <Text style={styles.liveDot}>●</Text>
                      <Text style={styles.liveLabel}>EN DIRECT</Text>
                    </View>

                    {/* Hôte */}
                    <View style={styles.hostInfo}>
                      <Text style={styles.hostName}>
                        {live.hostName}, {live.hostAge}
                      </Text>
                      <Text style={styles.hostRole}>🎤 Hôte</Text>
                    </View>

                    {/* Question */}
                    <Text style={styles.question} numberOfLines={2}>
                      {live.question}
                    </Text>

                    {/* Participants */}
                    <View style={styles.participantInfo}>
                      <Text style={styles.participantIcon}>👥</Text>
                      <Text style={styles.participantCount}>
                        {live.participantCount} connectés
                      </Text>
                    </View>

                    {/* CTA */}
                    <View style={styles.ctaContainer}>
                      <Text style={styles.ctaArrow}>→</Text>
                      <Text style={styles.ctaText}>Rejoindre</Text>
                    </View>
                  </TouchableOpacity>
                </GlassCard>
              ))}
            </View>
          ) : (
            <GlassCard style={styles.emptyCard} intensity={20}>
              <View style={styles.emptyContent}>
                <Text style={styles.emptyIcon}>🌫️</Text>
                <Text style={styles.emptyTitle}>Pas de lives actifs</Text>
                <Text style={styles.emptySubtitle}>
                  Lance le premier et connecte-toi avec d'autres ! 💜
                </Text>
              </View>
            </GlassCard>
          )}
        </View>

        {/* Info */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>ℹ️ À propos du Live</Text>
          <Text style={styles.infoText}>
            Sur Flou, les lives sont des moments de connexion émotionnelle. Vous vous posez des questions, partagez vos valeurs et découvrez celui ou celle avec qui vous êtes vraiment compatible.
          </Text>
        </View>

        <View style={styles.spacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.dark,
  },
  headerSubtitle: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 4,
  },
  createLiveBtn: {
    marginHorizontal: 20,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  createLiveIcon: {
    fontSize: 28,
  },
  createLiveContent: {
    flex: 1,
  },
  createLiveTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  createLiveSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.dark,
  },
  refreshBtn: {
    fontSize: 18,
    color: theme.colors.primary,
  },
  livesList: {
    gap: 12,
  },
  liveCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  liveCardTouchable: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 8,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  liveDot: {
    fontSize: 12,
    color: '#d32f2f',
  },
  liveLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#d32f2f',
    letterSpacing: 0.5,
  },
  hostInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hostName: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.dark,
  },
  hostRole: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  question: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text,
    lineHeight: 18,
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  participantIcon: {
    fontSize: 14,
  },
  participantCount: {
    fontSize: 12,
    color: theme.colors.textMuted,
    fontWeight: '500',
  },
  ctaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 4,
  },
  ctaArrow: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  ctaText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  loadingContainer: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 32,
  },
  loadingText: {
    fontSize: 14,
    color: theme.colors.textMuted,
  },
  emptyCard: {
    borderRadius: 16,
    paddingVertical: 32,
  },
  emptyContent: {
    alignItems: 'center',
    gap: 12,
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.dark,
  },
  emptySubtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  infoSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.dark,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    lineHeight: 18,
    fontWeight: '500',
  },
  spacer: {
    height: 40,
  },
});
