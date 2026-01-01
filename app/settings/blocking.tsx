import React, { useState } from 'react';
import HideKeyboardArrow from '../../components/HideKeyboardArrow';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

// Utilisateurs bloqués simulés
const BLOCKED_USERS = [
  { id: '1', name: 'Thomas_92', reason: 'Comportement inapproprié', date: '15 déc. 2025' },
  { id: '2', name: 'Julie_paris', reason: 'Spam', date: '12 déc. 2025' },
  { id: '3', name: 'Marco_fit', reason: 'Harcèlement', date: '8 déc. 2025' },
];

const REPORT_REASONS = [
  { id: '1', icon: '🚫', label: 'Comportement inapproprié' },
  { id: '2', icon: '📧', label: 'Spam ou arnaque' },
  { id: '3', icon: '😡', label: 'Harcèlement' },
  { id: '4', icon: '🔞', label: 'Contenu explicite non sollicité' },
  { id: '5', icon: '👤', label: 'Faux profil' },
  { id: '6', icon: '🔪', label: 'Menaces ou violence' },
  { id: '7', icon: '💔', label: 'Autre raison' },
];

export default function BlockingScreen() {
  const router = useRouter();
  const [blockedUsers, setBlockedUsers] = useState(BLOCKED_USERS);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [reportDetails, setReportDetails] = useState('');
  const [activeTab, setActiveTab] = useState<'blocked' | 'reported'>('blocked');

  const handleUnblock = (userId: string, userName: string) => {
    Alert.alert(
      'Débloquer',
      `Veux-tu débloquer ${userName} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Débloquer',
          onPress: () => {
            setBlockedUsers(prev => prev.filter(u => u.id !== userId));
            Alert.alert('Débloqué', `${userName} a été débloqué.`);
          }
        }
      ]
    );
  };

  const handleReport = () => {
    if (!selectedReason) {
      Alert.alert('Erreur', 'Sélectionne une raison pour le signalement.');
      return;
    }
    Alert.alert(
      'Signalement envoyé',
      'Merci pour ton signalement. Notre équipe va examiner ce profil.',
      [{ text: 'OK' }]
    );
    setSelectedReason(null);
    setReportDetails('');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Blocage & Signalement</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'blocked' && styles.tabActive]}
            onPress={() => setActiveTab('blocked')}
          >
            <Text style={[styles.tabText, activeTab === 'blocked' && styles.tabTextActive]}>
              Bloqués ({blockedUsers.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'reported' && styles.tabActive]}
            onPress={() => setActiveTab('reported')}
          >
            <Text style={[styles.tabText, activeTab === 'reported' && styles.tabTextActive]}>
              Signaler
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {activeTab === 'blocked' ? (
            <>
              {/* Info Card */}
              <View style={styles.infoCard}>
                <View style={styles.infoIconContainer}>
                  <Text style={styles.infoIcon}>ℹ️</Text>
                </View>
                <Text style={styles.infoText}>
                  Les personnes bloquées ne peuvent plus voir ton profil, 
                  t&apos;envoyer de messages ou interagir avec toi.
                </Text>
              </View>

              {/* Liste des bloqués */}
              {blockedUsers.length > 0 ? (
                <View style={styles.blockedList}>
                  {blockedUsers.map((user, index) => (
                    <View 
                      key={user.id} 
                      style={[
                        styles.blockedItem,
                        index === blockedUsers.length - 1 && styles.lastItem
                      ]}
                    >
                      <View style={styles.blockedAvatar}>
                        <Text style={styles.blockedAvatarText}>
                          {user.name[0].toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.blockedInfo}>
                        <Text style={styles.blockedName}>{user.name}</Text>
                        <Text style={styles.blockedReason}>{user.reason}</Text>
                        <Text style={styles.blockedDate}>{user.date}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.unblockBtn}
                        onPress={() => handleUnblock(user.id, user.name)}
                      >
                        <Text style={styles.unblockText}>Débloquer</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>🎉</Text>
                  <Text style={styles.emptyTitle}>Aucun utilisateur bloqué</Text>
                  <Text style={styles.emptyText}>
                    Tu n&apos;as bloqué personne pour le moment
                  </Text>
                </View>
              )}
            </>
          ) : (
            <>
              {/* Section Signaler */}
              <View style={styles.reportSection}>
                <Text style={styles.sectionTitle}>Signaler un profil</Text>
                <Text style={styles.sectionSubtitle}>
                  Sélectionne la raison du signalement
                </Text>

                <View style={styles.reasonsGrid}>
                  {REPORT_REASONS.map((reason) => (
                    <TouchableOpacity
                      key={reason.id}
                      style={[
                        styles.reasonCard,
                        selectedReason === reason.id && styles.reasonCardSelected
                      ]}
                      onPress={() => setSelectedReason(reason.id)}
                    >
                      <Text style={styles.reasonIcon}>{reason.icon}</Text>
                      <Text style={[
                        styles.reasonLabel,
                        selectedReason === reason.id && styles.reasonLabelSelected
                      ]}>
                        {reason.label}
                      </Text>
                      {selectedReason === reason.id && (
                        <View style={styles.checkMark}>
                          <Text style={styles.checkMarkText}>✓</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Détails supplémentaires */}
                <View style={styles.detailsContainer}>
                  <Text style={styles.detailsLabel}>Détails supplémentaires (optionnel)</Text>
                  <HideKeyboardArrow />
                  <TextInput
                    style={styles.detailsInput}
                    placeholder="Décris ce qui s'est passé..."
                    placeholderTextColor="#a0aec0"
                    value={reportDetails}
                    onChangeText={setReportDetails}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>

                {/* Bouton Signaler */}
                <TouchableOpacity
                  style={[
                    styles.reportButton,
                    !selectedReason && styles.reportButtonDisabled
                  ]}
                  onPress={handleReport}
                  disabled={!selectedReason}
                >
                  <Text style={styles.reportButtonText}>Envoyer le signalement</Text>
                </TouchableOpacity>
              </View>

              {/* Avertissement */}
              <View style={styles.warningCard}>
                <Text style={styles.warningIcon}>⚠️</Text>
                <Text style={styles.warningText}>
                  Les faux signalements peuvent entraîner des sanctions sur ton compte.
                </Text>
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0f0f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 28,
    color: '#333',
    marginTop: -2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },

  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: '#f0f0f5',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#667eea',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  tabTextActive: {
    color: '#fff',
  },

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },

  // Info Card
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#e8f4fd',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
    gap: 12,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoIcon: {
    fontSize: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#2c5282',
    lineHeight: 20,
  },

  // Blocked List
  blockedList: {
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  blockedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f5',
    gap: 12,
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  blockedAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#667eea',
    alignItems: 'center',
    justifyContent: 'center',
  },
  blockedAvatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  blockedInfo: {
    flex: 1,
  },
  blockedName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  blockedReason: {
    fontSize: 13,
    color: '#e53e3e',
    marginBottom: 2,
  },
  blockedDate: {
    fontSize: 12,
    color: '#999',
  },
  unblockBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#f0f0f5',
  },
  unblockText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#667eea',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    backgroundColor: '#fff',
    borderRadius: 20,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },

  // Report Section
  reportSection: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#999',
    marginBottom: 20,
  },

  // Reasons Grid
  reasonsGrid: {
    gap: 10,
  },
  reasonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  reasonCardSelected: {
    backgroundColor: '#eef2ff',
    borderColor: '#667eea',
  },
  reasonIcon: {
    fontSize: 22,
    marginRight: 12,
  },
  reasonLabel: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  reasonLabelSelected: {
    color: '#667eea',
    fontWeight: '600',
  },
  checkMark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#667eea',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMarkText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },

  // Details Input
  detailsContainer: {
    marginTop: 20,
  },
  detailsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  detailsInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 16,
    fontSize: 15,
    color: '#333',
    minHeight: 100,
    borderWidth: 1,
    borderColor: '#eee',
  },

  // Report Button
  reportButton: {
    marginTop: 20,
    backgroundColor: '#e53e3e',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  reportButtonDisabled: {
    backgroundColor: '#fed7d7',
  },
  reportButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },

  // Warning Card
  warningCard: {
    flexDirection: 'row',
    backgroundColor: '#fffbeb',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 12,
  },
  warningIcon: {
    fontSize: 24,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#92400e',
    lineHeight: 18,
  },
});
