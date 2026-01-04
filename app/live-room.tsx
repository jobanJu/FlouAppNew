import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useLiveKit } from '@/hooks/useLiveKit';
import GlassCard from '@/components/GlassCard';
import theme from '@/constants/theme';

/**
 * LiveRoom - Salle de connexion live avec LiveKit
 * Respecte le design FLOU
 */
export default function LiveRoom() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { createLiveRoom, joinLiveRoom, loading } = useLiveKit();

  const [liveConfig, setLiveConfig] = useState<any>(null);
  const [isConnecting, setIsConnecting] = useState(true);

  useEffect(() => {
    initializeLiveRoom();
  }, []);

  const initializeLiveRoom = async () => {
    try {
      setIsConnecting(true);

      const userId = 'user_001';
      const userName = 'Alex';
      const isHost = params?.isHost === 'true' ? true : false;

      let config;
      if (isHost) {
        config = await createLiveRoom(userId, userName);
      } else {
        const roomName = params?.roomName as string;
        if (!roomName) {
          throw new Error('Room name manquant');
        }
        config = await joinLiveRoom(roomName, userName, isHost);
      }

      if (!config) {
        throw new Error('Impossible de créer/rejoindre la salle');
      }

      setLiveConfig(config);
      console.log('✅ Live room initialisée:', config.roomName);
    } catch (error) {
      console.error('❌ Erreur LiveRoom:', error);
      Alert.alert(
        'Erreur',
        error instanceof Error ? error.message : 'Impossible de démarrer le live',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } finally {
      setIsConnecting(false);
    }
  };

  const handleLeaveRoom = () => {
    Alert.alert(
      'Quitter le live ?',
      'La salle sera fermée pour tous les participants',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Quitter',
          style: 'destructive',
          onPress: () => router.back(),
        },
      ]
    );
  };

  if (isConnecting || !liveConfig) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Connexion LiveKit...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* En-tête */}
      <View style={styles.header}>
        <View>
          <Text style={styles.roomTitle}>🔴 Live en direct</Text>
          <Text style={styles.roomName}>{liveConfig.roomName}</Text>
        </View>
        <TouchableOpacity style={styles.closeBtn} onPress={handleLeaveRoom}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Zone vidéo - Placeholder pour LiveKit */}
      <View style={styles.videoContainer}>
        <GlassCard style={styles.videoPlaceholder} intensity={20}>
          <View style={styles.videoContent}>
            <Text style={styles.videoIcon}>📹</Text>
            <Text style={styles.videoText}>Flux vidéo LiveKit</Text>
            <Text style={styles.videoUrl}>ws: {liveConfig.url.substring(0, 30)}...</Text>
          </View>
        </GlassCard>
      </View>

      {/* Infos et contrôles */}
      <View style={styles.controls}>
        <GlassCard style={styles.infoCard} intensity={40}>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>En Live</Text>
            <Text style={styles.infoValue}>{liveConfig.userName}</Text>
            {liveConfig.isHost && (
              <View style={styles.hostBadge}>
                <Text style={styles.hostBadgeText}>🎤 Hôte</Text>
              </View>
            )}
            <View style={styles.tokenPreview}>
              <Text style={styles.tokenLabel}>Token:</Text>
              <Text style={styles.tokenValue} numberOfLines={1}>
                {liveConfig.token.substring(0, 40)}...
              </Text>
            </View>
          </View>
        </GlassCard>

        {/* Bouton quitter */}
        <TouchableOpacity
          style={styles.leaveBtn}
          onPress={handleLeaveRoom}
          activeOpacity={0.8}
        >
          <Text style={styles.leaveBtnIcon}>📵</Text>
          <Text style={styles.leaveBtnText}>Quitter le live</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  roomTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.dark,
  },
  roomName: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
    fontFamily: 'monospace',
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(211, 47, 47, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: 20,
    color: '#d32f2f',
    fontWeight: '600',
  },
  videoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginVertical: 20,
  },
  videoPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoContent: {
    alignItems: 'center',
    gap: 12,
  },
  videoIcon: {
    fontSize: 48,
  },
  videoText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.dark,
  },
  videoUrl: {
    fontSize: 11,
    color: theme.colors.textMuted,
    fontFamily: 'monospace',
  },
  controls: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  infoCard: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  infoContent: {
    gap: 8,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.dark,
  },
  hostBadge: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.primaryLight,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 4,
  },
  hostBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  tokenPreview: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginTop: 4,
  },
  tokenLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: theme.colors.textMuted,
    marginBottom: 2,
  },
  tokenValue: {
    fontSize: 9,
    color: theme.colors.primary,
    fontFamily: 'monospace',
  },
  leaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#d32f2f',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
  },
  leaveBtnIcon: {
    fontSize: 18,
  },
  leaveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
});
