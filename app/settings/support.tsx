import React, { useState } from 'react';
import HideKeyboardArrow from '../../components/HideKeyboardArrow';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';

const FAQ_ITEMS = [
  {
    id: '1',
    question: 'Comment fonctionne le système Brumes ?',
    answer: 'Les Brumes sont notre monnaie virtuelle. Tu peux les acheter ou les gagner en utilisant l\'app. Elles servent à débloquer des fonctionnalités premium, envoyer des cadeaux, ou booster ton profil.',
    icon: '💎',
  },
  {
    id: '2',
    question: 'Comment puis-je devenir vérifié ?',
    answer: 'Pour obtenir le badge vérifié, va dans les paramètres de ton profil et suis les étapes de vérification. Tu devras prendre un selfie en temps réel pour prouver ton identité.',
    icon: '✓',
  },
  {
    id: '3',
    question: 'Comment supprimer mon compte ?',
    answer: 'Tu peux supprimer ton compte dans Paramètres > Compte > Supprimer le compte. Cette action est irréversible et toutes tes données seront supprimées.',
    icon: '🗑️',
  },
  {
    id: '4',
    question: 'Comment signaler un utilisateur ?',
    answer: 'Tu peux signaler un utilisateur en allant sur son profil et en appuyant sur les trois points en haut à droite, puis "Signaler". Tu peux aussi le faire depuis les paramètres de blocage.',
    icon: '🚨',
  },
  {
    id: '5',
    question: 'Comment fonctionne le Live Date ?',
    answer: 'Le Live Date te permet de rencontrer quelqu\'un en direct. Vous répondez tous les deux aux mêmes questions. Si vous avez au moins 6 réponses sur 10 en commun, c\'est un match !',
    icon: '💕',
  },
  {
    id: '6',
    question: 'Qu\'est-ce que le Flouté ?',
    answer: 'Le mode Flouté te permet de rendre ton profil flou pour les autres utilisateurs. Seuls ceux avec qui tu matches peuvent voir ton profil clairement.',
    icon: '🌫️',
  },
];

const CONTACT_OPTIONS = [
  {
    id: '1',
    icon: '📧',
    title: 'Email',
    subtitle: 'support@flouapp.com',
    action: () => Linking.openURL('mailto:support@flouapp.com'),
  },
  {
    id: '2',
    icon: '💬',
    title: 'Chat en direct',
    subtitle: 'Temps d\'attente: ~5 min',
    action: () => Alert.alert('Chat', 'Fonctionnalité bientôt disponible'),
  },
  {
    id: '3',
    icon: '📱',
    title: 'Twitter',
    subtitle: '@FlouApp',
    action: () => Linking.openURL('https://twitter.com/FlouApp'),
  },
];

export default function SupportScreen() {
  const router = useRouter();
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [activeTab, setActiveTab] = useState<'faq' | 'contact'>('faq');

  const toggleFaq = (id: string) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  const sendFeedback = () => {
    if (feedbackText.trim().length < 10) {
      Alert.alert('Message trop court', 'Écris au moins 10 caractères.');
      return;
    }
    Alert.alert(
      'Message envoyé !',
      'Merci pour ton retour, nous te répondrons rapidement.',
      [{ text: 'OK', onPress: () => setFeedbackText('') }]
    );
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
          <Text style={styles.headerTitle}>Aide & Support</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'faq' && styles.tabActive]}
            onPress={() => setActiveTab('faq')}
          >
            <Text style={[styles.tabText, activeTab === 'faq' && styles.tabTextActive]}>
              FAQ
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'contact' && styles.tabActive]}
            onPress={() => setActiveTab('contact')}
          >
            <Text style={[styles.tabText, activeTab === 'contact' && styles.tabTextActive]}>
              Contact
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {activeTab === 'faq' ? (
            <>
              {/* Search suggestion */}
              <View style={styles.searchCard}>
                <Text style={styles.searchIcon}>🔍</Text>
                <Text style={styles.searchText}>
                  Tu ne trouves pas ta réponse ? Contacte-nous !
                </Text>
                <TouchableOpacity 
                  style={styles.searchButton}
                  onPress={() => setActiveTab('contact')}
                >
                  <Text style={styles.searchButtonText}>Contact</Text>
                </TouchableOpacity>
              </View>

              {/* FAQ List */}
              <View style={styles.faqContainer}>
                <Text style={styles.sectionTitle}>Questions fréquentes</Text>
                
                {FAQ_ITEMS.map((item, index) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.faqItem,
                      index === FAQ_ITEMS.length - 1 && styles.lastItem,
                      expandedFaq === item.id && styles.faqItemExpanded
                    ]}
                    onPress={() => toggleFaq(item.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.faqHeader}>
                      <View style={styles.faqIconContainer}>
                        <Text style={styles.faqIcon}>{item.icon}</Text>
                      </View>
                      <Text style={styles.faqQuestion}>{item.question}</Text>
                      <Text style={styles.faqArrow}>
                        {expandedFaq === item.id ? '−' : '+'}
                      </Text>
                    </View>
                    {expandedFaq === item.id && (
                      <View style={styles.faqAnswerContainer}>
                        <Text style={styles.faqAnswer}>{item.answer}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </>
          ) : (
            <>
              {/* Contact Options */}
              <View style={styles.contactSection}>
                <Text style={styles.sectionTitle}>Nous contacter</Text>
                
                {CONTACT_OPTIONS.map((option, index) => (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.contactItem,
                      index === CONTACT_OPTIONS.length - 1 && styles.lastItem
                    ]}
                    onPress={option.action}
                    activeOpacity={0.7}
                  >
                    <View style={styles.contactIconContainer}>
                      <Text style={styles.contactIcon}>{option.icon}</Text>
                    </View>
                    <View style={styles.contactInfo}>
                      <Text style={styles.contactTitle}>{option.title}</Text>
                      <Text style={styles.contactSubtitle}>{option.subtitle}</Text>
                    </View>
                    <Text style={styles.contactArrow}>›</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Message Form */}
              <View style={styles.feedbackSection}>
                <Text style={styles.sectionTitle}>Envoyer un message</Text>
                <Text style={styles.feedbackSubtitle}>
                  Décris ton problème ou ta suggestion
                </Text>
                
                <HideKeyboardArrow />
                <TextInput
                  style={styles.feedbackInput}
                  placeholder="Écris ton message ici..."
                  placeholderTextColor="#a0aec0"
                  value={feedbackText}
                  onChangeText={setFeedbackText}
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                />

                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    feedbackText.trim().length < 10 && styles.sendButtonDisabled
                  ]}
                  onPress={sendFeedback}
                >
                  <Text style={styles.sendButtonText}>Envoyer</Text>
                </TouchableOpacity>
              </View>

              {/* Emergency */}
              <View style={styles.emergencyCard}>
                <View style={styles.emergencyHeader}>
                  <Text style={styles.emergencyIcon}>🆘</Text>
                  <Text style={styles.emergencyTitle}>Besoin d&apos;aide urgente ?</Text>
                </View>
                <Text style={styles.emergencyText}>
                  Si tu es en danger, contacte les autorités locales ou appelle le 17.
                </Text>
                <TouchableOpacity 
                  style={styles.emergencyButton}
                  onPress={() => Linking.openURL('tel:17')}
                >
                  <Text style={styles.emergencyButtonText}>Appeler le 17</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* App info */}
          <View style={styles.appInfo}>
            <Text style={styles.appName}>Flou App</Text>
            <Text style={styles.appVersion}>Version 1.0.0</Text>
            <View style={styles.legalLinks}>
              <TouchableOpacity>
                <Text style={styles.legalLink}>Conditions d&apos;utilisation</Text>
              </TouchableOpacity>
              <Text style={styles.legalDot}>•</Text>
              <TouchableOpacity>
                <Text style={styles.legalLink}>Politique de confidentialité</Text>
              </TouchableOpacity>
            </View>
          </View>
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

  // Search Card
  searchCard: {
    flexDirection: 'row',
    backgroundColor: '#e8f4fd',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
    gap: 12,
  },
  searchIcon: {
    fontSize: 24,
  },
  searchText: {
    flex: 1,
    fontSize: 14,
    color: '#2c5282',
    lineHeight: 20,
  },
  searchButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },

  // Section
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },

  // FAQ
  faqContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f5',
    paddingVertical: 16,
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  faqItemExpanded: {
    backgroundColor: '#f8f9fa',
    marginHorizontal: -20,
    paddingHorizontal: 20,
    borderRadius: 0,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  faqIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  faqIcon: {
    fontSize: 18,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    lineHeight: 20,
  },
  faqArrow: {
    fontSize: 22,
    color: '#667eea',
    fontWeight: '300',
  },
  faqAnswerContainer: {
    marginTop: 12,
    marginLeft: 52,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },

  // Contact Section
  contactSection: {
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
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f5',
    gap: 12,
  },
  contactIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactIcon: {
    fontSize: 24,
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  contactSubtitle: {
    fontSize: 13,
    color: '#999',
  },
  contactArrow: {
    fontSize: 24,
    color: '#ccc',
  },

  // Feedback Section
  feedbackSection: {
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
  feedbackSubtitle: {
    fontSize: 14,
    color: '#999',
    marginBottom: 16,
    marginTop: -8,
  },
  feedbackInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 16,
    fontSize: 15,
    color: '#333',
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#eee',
  },
  sendButton: {
    marginTop: 16,
    backgroundColor: '#667eea',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#c3dafe',
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },

  // Emergency Card
  emergencyCard: {
    backgroundColor: '#fff0f0',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#fed7d7',
    marginBottom: 24,
  },
  emergencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  emergencyIcon: {
    fontSize: 24,
  },
  emergencyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#c53030',
  },
  emergencyText: {
    fontSize: 14,
    color: '#742a2a',
    lineHeight: 20,
    marginBottom: 16,
  },
  emergencyButton: {
    backgroundColor: '#e53e3e',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  emergencyButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },

  // App Info
  appInfo: {
    alignItems: 'center',
    paddingTop: 16,
  },
  appName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  appVersion: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
  },
  legalLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  legalLink: {
    fontSize: 13,
    color: '#667eea',
  },
  legalDot: {
    color: '#ccc',
  },
});
