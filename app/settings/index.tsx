import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
    Alert,
    Dimensions,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getDeviceId } from '../../lib/device-id';
import { supabase } from '../../lib/supabase';
import theme from '@/constants/theme';

const { width } = Dimensions.get('window');

export default function SettingsScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [notifications, setNotifications] = useState(true);
  const [showOnline, setShowOnline] = useState(true);
  const [showDistance, setShowDistance] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const deviceId = await getDeviceId();
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('device_id', deviceId)
        .maybeSingle();
      if (data) setProfile(data);
    } catch (e) {
      console.log('Profile fetch error');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Es-tu sûr(e) de vouloir te déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Déconnexion', 
          style: 'destructive',
          onPress: async () => {
            try {
              // Supprimer toutes les données de session
              await AsyncStorage.multiRemove([
                'flou_onboarding_complete',
                'flou_user_profile',
                'flou_user_email',
                'flou_last_daily_claim',
                'flou_daily_streak',
              ]);
              router.replace('/onboarding');
            } catch (e) {
              console.log('Logout error:', e);
              router.replace('/onboarding');
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mon Profil</Text>
          <TouchableOpacity onPress={() => router.push('/settings/edit-profile')}>
            <Text style={styles.editText}>Modifier</Text>
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Card */}
          <View style={styles.profileCard}>
            <View style={styles.profileImageContainer}>
              <LinearGradient
                colors={['#FF6B6B', '#FF8E53', '#FFC46B']}
                style={styles.profileGradient}
              >
                <Text style={styles.profileInitial}>
                  {profile?.name?.[0]?.toUpperCase() || '?'}
                </Text>
              </LinearGradient>
              <View style={styles.onlineDot} />
            </View>

            <Text style={styles.profileName}>{profile?.name || 'Mon Prénom'}, {profile?.age || '??'}</Text>
            
            <View style={styles.locationRow}>
              <Text style={styles.locationIcon}>📍</Text>
              <Text style={styles.locationText}>{profile?.city || 'Paris'}</Text>
            </View>

            {/* Stats Row */}
            <View style={styles.statsContainer}>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>127</Text>
                <Text style={styles.statLabel}>Likes</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>34</Text>
                <Text style={styles.statLabel}>Matchs</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>89%</Text>
                <Text style={styles.statLabel}>Profil</Text>
              </View>
            </View>

            {/* Edit Profile Button */}
            <TouchableOpacity 
              style={styles.editProfileBtn}
              onPress={() => router.push('/settings/edit-profile')}
            >
              <Text style={styles.editProfileText}>✏️ Modifier mon profil</Text>
            </TouchableOpacity>
          </View>

          {/* Premium Banner */}
          <TouchableOpacity 
            style={styles.premiumBanner}
            onPress={() => router.push('/shop')}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.premiumGradient}
            >
              <Text style={styles.premiumIcon}>✨</Text>
              <View style={styles.premiumText}>
                <Text style={styles.premiumTitle}>Passe en Premium</Text>
                <Text style={styles.premiumSubtitle}>Débloque toutes les fonctionnalités</Text>
              </View>
              <Text style={styles.premiumArrow}>→</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Settings Sections */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mon compte</Text>
            <View style={styles.card}>
              <SettingRow 
                icon="🎤" 
                title="Vocal de présentation"
                subtitle="Non enregistré"
                onPress={() => Alert.alert('Bientôt disponible')}
              />
              <SettingRow 
                icon="💳" 
                title="Abonnement"
                subtitle="Gratuit"
                onPress={() => router.push('/shop')}
                isLast
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Préférences</Text>
            <View style={styles.card}>
              <SettingToggle
                icon="🔔"
                title="Notifications"
                value={notifications}
                onValueChange={setNotifications}
              />
              <SettingToggle
                icon="🟢"
                title="Afficher statut en ligne"
                value={showOnline}
                onValueChange={setShowOnline}
              />
              <SettingToggle
                icon="📍"
                title="Afficher la distance"
                value={showDistance}
                onValueChange={setShowDistance}
                isLast
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Découverte</Text>
            <View style={styles.card}>
              <SettingRow 
                icon="🎂" 
                title="Tranche d'âge"
                subtitle="18 - 35 ans"
                onPress={() => Alert.alert('Bientôt disponible')}
              />
              <SettingRow 
                icon="📏" 
                title="Distance maximum"
                subtitle="50 km"
                onPress={() => Alert.alert('Bientôt disponible')}
                isLast
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Confidentialité</Text>
            <View style={styles.card}>
              <SettingRow 
                icon="🚫" 
                title="Comptes bloqués"
                onPress={() => router.push('/settings/blocking')}
              />
              <SettingRow 
                icon="👻" 
                title="Mode incognito"
                subtitle="Désactivé"
                onPress={() => Alert.alert('Bientôt disponible')}
              />
              <SettingRow 
                icon="🔒" 
                title="Données personnelles"
                onPress={() => Alert.alert('Bientôt disponible')}
                isLast
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Support</Text>
            <View style={styles.card}>
              <SettingRow 
                icon="❓" 
                title="Centre d'aide"
                onPress={() => router.push('/settings/support')}
              />
              <SettingRow 
                icon="⭐" 
                title="Noter l'application"
                onPress={() => Alert.alert('Merci !', 'Redirection vers le store...')}
              />
              <SettingRow 
                icon="📜" 
                title="Conditions d'utilisation"
                onPress={() => Alert.alert('CGU')}
                isLast
              />
            </View>
          </View>

          {/* Logout Button */}
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutText}>Se déconnecter</Text>
          </TouchableOpacity>

          {/* Version */}
          <Text style={styles.versionText}>Flou v1.0.0</Text>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// Composant SettingRow
const SettingRow = ({ 
  icon, 
  title, 
  subtitle, 
  onPress, 
  isLast = false 
}: { 
  icon: string; 
  title: string; 
  subtitle?: string; 
  onPress?: () => void;
  isLast?: boolean;
}) => (
  <TouchableOpacity 
    style={[styles.settingRow, !isLast && styles.settingRowBorder]} 
    onPress={onPress}
    activeOpacity={0.6}
  >
    <View style={styles.settingIconBox}>
      <Text style={styles.settingIcon}>{icon}</Text>
    </View>
    <View style={styles.settingContent}>
      <Text style={styles.settingTitle}>{title}</Text>
      {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
    </View>
    <Text style={styles.settingArrow}>›</Text>
  </TouchableOpacity>
);

// Composant SettingToggle
const SettingToggle = ({ 
  icon, 
  title, 
  value, 
  onValueChange,
  isLast = false 
}: { 
  icon: string; 
  title: string; 
  value: boolean; 
  onValueChange: (v: boolean) => void;
  isLast?: boolean;
}) => (
  <View style={[styles.settingRow, !isLast && styles.settingRowBorder]}>
    <View style={styles.settingIconBox}>
      <Text style={styles.settingIcon}>{icon}</Text>
    </View>
    <View style={styles.settingContent}>
      <Text style={styles.settingTitle}>{title}</Text>
    </View>
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: '#E5E5EA', true: '#667eea' }}
      thumbColor="#fff"
      style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
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
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    color: '#333',
    fontSize: 24,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  editText: {
    color: '#667eea',
    fontSize: 15,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  // Profile Card
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitial: {
    color: '#fff',
    fontSize: 40,
    fontWeight: '800',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.primary,
    borderWidth: 3,
    borderColor: '#fff',
  },
  profileName: {
    color: '#1a1a1a',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  locationIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  locationText: {
    color: '#8E8E93',
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#F8F8FA',
    marginHorizontal: 4,
    borderRadius: 12,
  },
  statNumber: {
    color: '#1a1a1a',
    fontSize: 20,
    fontWeight: '800',
  },
  statLabel: {
    color: '#8E8E93',
    fontSize: 12,
    marginTop: 2,
  },
  editProfileBtn: {
    backgroundColor: '#F0F0F5',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  editProfileText: {
    color: '#667eea',
    fontSize: 14,
    fontWeight: '600',
  },

  // Premium Banner
  premiumBanner: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  premiumGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
  },
  premiumIcon: {
    fontSize: 28,
    marginRight: 14,
  },
  premiumText: {
    flex: 1,
  },
  premiumTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  premiumSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    marginTop: 2,
  },
  premiumArrow: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },

  // Sections
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#8E8E93',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  settingRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F2',
  },
  settingIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F5F5F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  settingIcon: {
    fontSize: 18,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    color: '#1a1a1a',
    fontSize: 15,
    fontWeight: '500',
  },
  settingSubtitle: {
    color: '#8E8E93',
    fontSize: 13,
    marginTop: 1,
  },
  settingArrow: {
    color: '#C7C7CC',
    fontSize: 20,
    fontWeight: '400',
  },

  // Logout
  logoutBtn: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  logoutText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
  },

  // Version
  versionText: {
    color: '#C7C7CC',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 20,
  },
});
