import React, { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import GlassCard from '@/components/GlassCard';
import Wallet from '@/components/Wallet';
import theme from '@/constants/theme';

const { width } = Dimensions.get('window');

// Données de test
const TEST_USER = {
  id: 'user_001',
  firstName: 'Alex',
  age: 26,
  photo: { uri: 'https://via.placeholder.com/400x600?text=Profile' },
  bio: 'Chercheur de vraies connexions • Surfeur passion 🏄 • Minimaliste du cœur',
  brumes: 42,
  isPremium: false,
  interests: ['Voyages', 'Musique', 'Philosophie', 'Cuisine'],
  voiceMessage: null,
  videoBio: null,
};

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState(TEST_USER);
  const [launching, setLaunching] = useState(false);

  const handleLaunchLive = async () => {
    setLaunching(true);
    Alert.alert(
      '🔴 Lancer un Live',
      'Tu vas créer une session de connexion en direct.\n\nLes autres utilisateurs verront :\n• Ton profil flouté\n• Tes questions\n• Ton énergie',
      [
        {
          text: 'Annuler',
          onPress: () => setLaunching(false),
        },
        {
          text: 'Lancer le Live',
          onPress: () => {
            console.log('🔴 Live lancé:', user.firstName);
            router.push('/live-room');
            setLaunching(false);
          },
        },
      ]
    );
  };

  const handleRecharge = () => {
    Alert.alert('Recharger Brumes', 'Redirection vers la boutique (à implémenter)');
  };

  const handleEditProfile = () => {
    Alert.alert('Éditer le profil', 'Redirection vers l\'éditeur (à implémenter)');
  };

  const handleRecordVoice = () => {
    Alert.alert('Enregistrer voix', 'Fonctionnalité audio (à implémenter)');
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
          <Text style={styles.headerTitle}>Mon Profil</Text>
          <TouchableOpacity 
            style={styles.settingsBtn}
            onPress={() => router.push('/settings')}
          >
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* Photo Profil - NETTE (contrairement au swipe) */}
        <GlassCard style={styles.photoCard} intensity={20}>
          <Image source={user.photo} style={styles.photo} />

          {/* Badges de vérification */}
          <View style={styles.badges}>
            {user.isPremium && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>✨ Premium</Text>
              </View>
            )}
            <View style={styles.badge}>
              <Text style={styles.badgeText}>✔️ Vérifié</Text>
            </View>
          </View>
        </GlassCard>

        {/* Identité */}
        <View style={styles.identitySection}>
          <Text style={styles.userName}>
            {user.firstName}, {user.age}
          </Text>
          <Text style={styles.userBio}>{user.bio}</Text>
        </View>

        {/* WALLET - PRIORITAIRE */}
        <Wallet
          brumes={user.brumes}
          onRecharge={handleRecharge}
          isPremium={user.isPremium}
        />

        {/* Studio de Personnalité */}
        <GlassCard style={styles.studioCard} intensity={35}>
          <View style={styles.studioHeader}>
            <Text style={styles.studioTitle}>🎨 Studio de Personnalité</Text>
          </View>

          {/* Actions personnalité */}
          <View style={styles.studioActions}>
            {/* Voix */}
            <TouchableOpacity style={styles.studioBtn} onPress={handleRecordVoice}>
              <Text style={styles.studioBtnIcon}>🎙️</Text>
              <View style={styles.studioBtnText}>
                <Text style={styles.studioBtnTitle}>Voix</Text>
                <Text style={styles.studioBtnSubtitle}>
                  {user.voiceMessage ? '✓ Enregistrée' : 'Enregistrer'}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Vidéo Bio */}
            <TouchableOpacity style={styles.studioBtn}>
              <Text style={styles.studioBtnIcon}>📹</Text>
              <View style={styles.studioBtnText}>
                <Text style={styles.studioBtnTitle}>Vidéo</Text>
                <Text style={styles.studioBtnSubtitle}>
                  {user.videoBio ? '✓ Ajoutée' : 'Ajouter'}
                </Text>
              </View>
              {!user.videoBio && (
                <Text style={styles.studioBtnLock}>🔒</Text>
              )}
            </TouchableOpacity>

            {/* Bio Texte */}
            <TouchableOpacity style={styles.studioBtn} onPress={handleEditProfile}>
              <Text style={styles.studioBtnIcon}>✏️</Text>
              <View style={styles.studioBtnText}>
                <Text style={styles.studioBtnTitle}>Bio</Text>
                <Text style={styles.studioBtnSubtitle}>Éditer</Text>
              </View>
            </TouchableOpacity>
          </View>
        </GlassCard>

        {/* Intérêts */}
        <View style={styles.interestsSection}>
          <Text style={styles.interestsTitle}>Tes valeurs</Text>
          <View style={styles.interestsTags}>
            {user.interests.map((interest, idx) => (
              <View key={idx} style={styles.interestTag}>
                <Text style={styles.interestTagText}>{interest}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ACTION PRINCIPALE - LANCER UN LIVE */}
        <TouchableOpacity
          style={styles.launchLiveBtn}
          onPress={handleLaunchLive}
          activeOpacity={0.8}
          disabled={launching}
        >
          <Text style={styles.launchLiveIcon}>🔴</Text>
          <View style={styles.launchLiveContent}>
            <Text style={styles.launchLiveTitle}>
              {launching ? 'Lancement...' : 'Lancer un Live'}
            </Text>
            <Text style={styles.launchLiveSubtitle}>
              Connecte-toi en direct avec d'autres
            </Text>
          </View>
          <Text style={styles.launchLiveArrow}>→</Text>
        </TouchableOpacity>

        {/* Autres actions */}
        <View style={styles.actionsGrid}>
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/settings/edit-profile')}
          >
            <Text style={styles.actionIcon}>✏️</Text>
            <Text style={styles.actionLabel}>Éditer Profil</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <Text style={styles.actionIcon}>🛡️</Text>
            <Text style={styles.actionLabel}>Sécurité</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <Text style={styles.actionIcon}>❓</Text>
            <Text style={styles.actionLabel}>Aide</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => {
              Alert.alert('Déconnexion', 'À implémenter');
            }}
          >
            <Text style={styles.actionIcon}>🚪</Text>
            <Text style={styles.actionLabel}>Déconnexion</Text>
          </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.dark,
  },
  settingsBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(108, 92, 231, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsIcon: {
    fontSize: 20,
  },
  photoCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    height: 280,
    borderRadius: 24,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  badges: {
    position: 'absolute',
    top: 12,
    right: 12,
    gap: 8,
  },
  badge: {
    backgroundColor: 'rgba(108, 92, 231, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  identitySection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.dark,
    marginBottom: 8,
  },
  userBio: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    fontWeight: '500',
  },
  studioCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 16,
  },
  studioHeader: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  studioTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.dark,
  },
  studioActions: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
  },
  studioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(108, 92, 231, 0.08)',
    borderRadius: 12,
    gap: 12,
  },
  studioBtnIcon: {
    fontSize: 20,
  },
  studioBtnText: {
    flex: 1,
  },
  studioBtnTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.dark,
  },
  studioBtnSubtitle: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  studioBtnLock: {
    fontSize: 14,
  },
  interestsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  interestsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.dark,
    marginBottom: 12,
  },
  interestsTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestTag: {
    backgroundColor: 'rgba(108, 92, 231, 0.1)',
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  interestTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  launchLiveBtn: {
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
  launchLiveIcon: {
    fontSize: 28,
  },
  launchLiveContent: {
    flex: 1,
  },
  launchLiveTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  launchLiveSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  launchLiveArrow: {
    fontSize: 20,
    color: '#fff',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  actionCard: {
    width: (width - 56) / 2,
    aspectRatio: 1,
    backgroundColor: 'rgba(108, 92, 231, 0.08)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(108, 92, 231, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  actionIcon: {
    fontSize: 24,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.dark,
    textAlign: 'center',
  },
  spacer: {
    height: 40,
  },
});
