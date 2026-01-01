import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

// Packs de Brumes
const BRUMES_PACKS = [
  { id: 'brumes_100', brumes: 100, price: 10, bonus: 0, popular: false },
  { id: 'brumes_200', brumes: 200, price: 20, bonus: 10, popular: false },
  { id: 'brumes_500', brumes: 500, price: 45, bonus: 50, popular: true },
  { id: 'brumes_1000', brumes: 1000, price: 80, bonus: 150, popular: false },
  { id: 'brumes_2500', brumes: 2500, price: 180, bonus: 500, popular: false },
  { id: 'brumes_5000', brumes: 5000, price: 320, bonus: 1200, popular: false },
];

// Actions payantes en Brumes
const BRUMES_ACTIONS = [
  { id: 'vocaux', icon: '🧊', name: 'Envoi de Vocaux', cost: 100, description: 'Envoyer des vocaux en message' },
  { id: 'reseaux', icon: '🔓', name: 'Déblocage Réseaux', cost: 100, description: 'Débloquer l\'Insta/Snap (si compte Gratuit)' },
  { id: 'defloutage', icon: '👁️', name: 'Défloutage Partiel', cost: 100, description: 'Accélérer la netteté d\'un profil spécifique' },
  { id: 'superlike', icon: '⭐', name: 'Super Like', cost: 300, description: 'Montrer un intérêt fort à quelqu\'un' },
  { id: 'boost', icon: '🚀', name: 'Boost Profil', cost: 300, description: '20 minutes de mise en avant' },
  { id: 'vocal_premium', icon: '🎙️', name: 'Vocal de Présentation', cost: 300, description: 'Ajouter un vocal de 5 sec sur ton profil' },
];

// Options payantes à part (hors abonnement)
const PAID_OPTIONS = [
  { id: 'assistant_ia', icon: '🤖', name: 'Assistant IA Séduction', price: 5.99, description: 'L\'IA t\'aide à rédiger tes messages de drague', period: '/mois' },
];

// Formules d'abonnement
const SUBSCRIPTIONS = [
  {
    id: 'classique',
    name: 'Classique',
    emoji: '⚪',
    price: 0,
    period: '',
    features: [
      { label: 'Matchs / Jour', value: '10' },
      { label: 'Niveau de Flou', value: 'Fort (Mystère total)' },
      { label: 'Vocaux', value: '❌ Non' },
      { label: 'Live Date', value: '1 / jour' },
      { label: 'Déblocage Réseaux', value: 'Après 3 jours' },
      { label: 'Boosts Profil', value: '❌ Payant' },
      { label: 'Visibilité', value: 'Standard' },
      { label: 'Brumes Offertes', value: '10 / jour' },
      { label: 'Badge Statut', value: 'Aucun' },
      { label: 'Vocal de Présentation', value: '❌' },
      { label: 'Assistant IA Séduction', value: 'Payant 5,99€' },
    ],
    color: ['#9e9e9e', '#757575'],
    current: true,
  },
  {
    id: 'kama',
    name: 'Kama',
    emoji: '🔵',
    price: 4.99,
    period: '/sem',
    features: [
      { label: 'Matchs / Jour', value: '20' },
      { label: 'Niveau de Flou', value: 'Léger (-1 niveau)' },
      { label: 'Vocaux', value: '✅ Illimités' },
      { label: 'Live Date', value: '2 / jour' },
      { label: 'Déblocage Réseaux', value: '200 Brumes' },
      { label: 'Boosts Profil', value: '1 / semaine' },
      { label: 'Visibilité', value: '+10%' },
      { label: 'Brumes Offertes', value: '+50 / semaine' },
      { label: 'Badge Statut', value: '🔵 Badge Kama' },
      { label: 'Vocal de Présentation', value: '❌' },
      { label: 'Assistant IA Séduction', value: 'Payant 5,99€' },
    ],
    color: ['#2196f3', '#1976d2'],
    popular: true,
  },
  {
    id: 'cupidon',
    name: 'Cupidon',
    emoji: '🟣',
    price: 14.99,
    period: '/sem',
    features: [
      { label: 'Matchs / Jour', value: 'Illimités ∞' },
      { label: 'Niveau de Flou', value: 'Très Léger (-2 niveaux)' },
      { label: 'Vocaux', value: '✅ Illimités' },
      { label: 'Live Date', value: 'Illimité ∞' },
      { label: 'Déblocage Réseaux', value: '100 Brumes' },
      { label: 'Boosts Profil', value: '2 / semaine' },
      { label: 'Visibilité', value: '+40% Prioritaire' },
      { label: 'Brumes Offertes', value: '+150 / semaine' },
      { label: 'Badge Statut', value: '🟣 Badge Cupidon' },
      { label: 'Vocal de Présentation', value: '✅ Oui (10 sec)' },
      { label: 'Assistant IA Séduction', value: '✅ Inclus' },
    ],
    color: ['#9c27b0', '#7b1fa2'],
    premium: true,
  },
];

export default function ShopScreen() {
  const [activeTab, setActiveTab] = useState<'brumes' | 'formules' | 'actions'>('formules');
  const [myBrumes, setMyBrumes] = useState(100); // À récupérer depuis Supabase
  const [loading, setLoading] = useState(false);

  const handleBuyBrumes = (pack: typeof BRUMES_PACKS[0]) => {
    Alert.alert(
      'Acheter des Brumes',
      `Voulez-vous acheter ${pack.brumes}${pack.bonus > 0 ? ` + ${pack.bonus} bonus` : ''} brumes pour ${pack.price.toFixed(2)}€ ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Acheter', 
          onPress: () => {
            Keyboard.dismiss();
            setLoading(true);
            // Intégration paiement (Stripe, etc.)
            setTimeout(() => {
              setMyBrumes(prev => prev + pack.brumes + pack.bonus);
              setLoading(false);
              Alert.alert('Succès ! 🎉', `Vous avez reçu ${pack.brumes + pack.bonus} brumes !`);
            }, 2000);
          }
        },
      ]
    );
  };

  const handleSubscribe = (sub: typeof SUBSCRIPTIONS[0]) => {
    if (sub.id === 'free') return;
    
    Alert.alert(
      `S'abonner à ${sub.name}`,
      `Voulez-vous vous abonner à ${sub.name} pour ${sub.price.toFixed(2)}€${sub.period} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: "S'abonner", 
          onPress: () => {
            Keyboard.dismiss();
            setLoading(true);
            // Intégration paiement (Stripe, etc.)
            setTimeout(() => {
              setLoading(false);
              Alert.alert('Succès ! 🎉', `Vous êtes maintenant abonné à ${sub.name} !`);
            }, 2000);
          }
        },
      ]
    );
  };

  const handleUseAction = (action: typeof BRUMES_ACTIONS[0]) => {
    if (myBrumes < action.cost) {
      Alert.alert(
        'Brumes insuffisantes',
        `Vous avez besoin de ${action.cost} brumes. Il vous en manque ${action.cost - myBrumes}.`,
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Acheter des Brumes', onPress: () => setActiveTab('brumes') }
        ]
      );
      return;
    }

    Alert.alert(
      action.name,
      `Utiliser ${action.cost} brumes pour "${action.name}" ?\n\n${action.description}`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Confirmer', 
          onPress: () => {
            setMyBrumes(prev => prev - action.cost);
            if (action.id === 'vocal_premium') {
              Alert.alert('🎙️ Vocal de Présentation', 'Tu peux maintenant enregistrer un vocal de 5 secondes depuis ton profil !');
            } else {
              Alert.alert('Succès ! ✅', `${action.name} activé !`);
            }
          }
        },
      ]
    );
  };

  const handleBuyOption = (option: typeof PAID_OPTIONS[0]) => {
    Alert.alert(
      `${option.icon} ${option.name}`,
      `${option.description}\n\nPrix: ${option.price.toFixed(2)}€${option.period}`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Acheter', 
          onPress: () => {
            Keyboard.dismiss();
            setLoading(true);
            // Intégration paiement (Stripe, etc.)
            setTimeout(() => {
              setLoading(false);
              Alert.alert('Succès ! 🎉', `${option.name} activé !\n\nL'IA va t'aider à rédiger tes messages de drague.`);
            }, 2000);
          }
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#faf9ff', '#f0eeff', '#e8e4ff']}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Boutique</Text>
            <View style={styles.brumesBalance}>
              <Text style={styles.brumesIcon}>☁️</Text>
              <Text style={styles.brumesCount}>{myBrumes}</Text>
            </View>
          </View>

          {/* Tabs */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'formules' && styles.tabActive]}
              onPress={() => setActiveTab('formules')}
            >
              <Text style={[styles.tabText, activeTab === 'formules' && styles.tabTextActive]}>
                💎 Formules
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'actions' && styles.tabActive]}
              onPress={() => setActiveTab('actions')}
            >
              <Text style={[styles.tabText, activeTab === 'actions' && styles.tabTextActive]}>
                ⚡ Actions
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'brumes' && styles.tabActive]}
              onPress={() => setActiveTab('brumes')}
            >
              <Text style={[styles.tabText, activeTab === 'brumes' && styles.tabTextActive]}>
                ☁️ Brumes
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 }]}
            showsVerticalScrollIndicator={false}
          >
            {activeTab === 'formules' ? (
              <>
                <Text style={styles.sectionTitle}>Choisissez votre formule</Text>
                <Text style={styles.sectionSubtitle}>
                  Débloquez des fonctionnalités exclusives
                </Text>

                {SUBSCRIPTIONS.map((sub) => (
                  <TouchableOpacity
                    key={sub.id}
                    style={[styles.subscriptionCard, sub.current && styles.subscriptionCurrent]}
                    onPress={() => handleSubscribe(sub)}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={sub.color as [string, string]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.subscriptionGradient}
                    >
                      {sub.popular && (
                        <View style={styles.popularBadge}>
                          <Text style={styles.popularText}>POPULAIRE</Text>
                        </View>
                      )}
                      {sub.premium && (
                        <View style={[styles.popularBadge, styles.premiumBadge]}>
                          <Text style={styles.popularText}>💜 CUPIDON</Text>
                        </View>
                      )}

                      <View style={styles.subscriptionHeader}>
                        <View style={styles.nameRow}>
                          <Text style={styles.subscriptionEmoji}>{sub.emoji}</Text>
                          <Text style={styles.subscriptionName}>{sub.name}</Text>
                        </View>
                        <View style={styles.priceContainer}>
                          {sub.price > 0 ? (
                            <>
                              <Text style={styles.subscriptionPrice}>{sub.price.toFixed(2)}€</Text>
                              <Text style={styles.subscriptionPeriod}>{sub.period}</Text>
                            </>
                          ) : (
                            <Text style={styles.subscriptionPrice}>Gratuit</Text>
                          )}
                        </View>
                      </View>

                      <View style={styles.featuresContainer}>
                        {sub.features.map((feature, index) => (
                          <View key={index} style={styles.featureRow}>
                            <Text style={styles.featureLabel}>{feature.label}</Text>
                            <Text style={styles.featureValue}>{feature.value}</Text>
                          </View>
                        ))}
                      </View>

                      {sub.current ? (
                        <View style={styles.currentBadge}>
                          <Text style={styles.currentText}>Formule actuelle</Text>
                        </View>
                      ) : (
                        <View style={styles.subscribeBtn}>
                          <Text style={styles.subscribeBtnText}>
                            S&apos;abonner
                          </Text>
                        </View>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                ))}

                <View style={styles.infoBox}>
                  <Text style={styles.infoIcon}>ℹ️</Text>
                  <Text style={styles.infoText}>
                    Les abonnements se renouvellent automatiquement. Vous pouvez annuler à tout moment depuis les paramètres.
                  </Text>
                </View>
              </>
            ) : activeTab === 'actions' ? (
              <>
                <Text style={styles.sectionTitle}>Actions avec Brumes</Text>
                <Text style={styles.sectionSubtitle}>
                  Utilisez vos brumes pour débloquer des fonctionnalités
                </Text>

                <View style={styles.actionsContainer}>
                  {BRUMES_ACTIONS.map((action) => (
                    <TouchableOpacity
                      key={action.id}
                      style={styles.actionCard}
                      onPress={() => handleUseAction(action)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.actionIconContainer}>
                        <Text style={styles.actionIcon}>{action.icon}</Text>
                      </View>
                      <View style={styles.actionContent}>
                        <Text style={styles.actionName}>{action.name}</Text>
                        <Text style={styles.actionDescription}>{action.description}</Text>
                      </View>
                      <View style={styles.actionCostContainer}>
                        <Text style={styles.actionCostIcon}>☁️</Text>
                        <Text style={styles.actionCost}>{action.cost === 5 ? '5+' : action.cost}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.infoBox}>
                  <Text style={styles.infoIcon}>💡</Text>
                  <Text style={styles.infoText}>
                    Les Brumes sont une monnaie virtuelle. Les actions sont instantanées et non remboursables.
                  </Text>
                </View>

                {/* Options payantes à part */}
                <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Options Premium</Text>
                <Text style={styles.sectionSubtitle}>
                  Fonctionnalités payantes en dehors des abonnements
                </Text>

                {PAID_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={styles.paidOptionCard}
                    onPress={() => handleBuyOption(option)}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#667eea', '#764ba2']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.paidOptionGradient}
                    >
                      <View style={styles.paidOptionIconContainer}>
                        <Text style={styles.paidOptionIcon}>{option.icon}</Text>
                      </View>
                      <View style={styles.paidOptionContent}>
                        <Text style={styles.paidOptionName}>{option.name}</Text>
                        <Text style={styles.paidOptionDescription}>{option.description}</Text>
                      </View>
                      <View style={styles.paidOptionPriceContainer}>
                        <Text style={styles.paidOptionPrice}>{option.price.toFixed(2)}€</Text>
                        <Text style={styles.paidOptionPeriod}>{option.period}</Text>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
              </>
            ) : (
              <>
                <Text style={styles.sectionTitle}>Acheter des Brumes</Text>
                <Text style={styles.sectionSubtitle}>
                  Envoyez des cadeaux aux créateurs pendant les lives
                </Text>

                <View style={styles.brumesGrid}>
                  {BRUMES_PACKS.map((pack) => (
                    <TouchableOpacity
                      key={pack.id}
                      style={[styles.brumesPack, pack.popular && styles.brumesPackPopular]}
                      onPress={() => handleBuyBrumes(pack)}
                      activeOpacity={0.8}
                    >
                      {pack.popular && (
                        <View style={styles.packPopularBadge}>
                          <Text style={styles.packPopularText}>BEST</Text>
                        </View>
                      )}
                      
                      <Text style={styles.packIcon}>☁️</Text>
                      <Text style={styles.packAmount}>{pack.brumes}</Text>
                      
                      {pack.bonus > 0 && (
                        <View style={styles.bonusBadge}>
                          <Text style={styles.bonusText}>+{pack.bonus}</Text>
                        </View>
                      )}
                      
                      <View style={styles.packPriceContainer}>
                        <Text style={styles.packPrice}>{pack.price.toFixed(2)}€</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.brumesInfoSection}>
                  <Text style={styles.brumesInfoTitle}>💡 À quoi servent les brumes ?</Text>
                  <View style={styles.brumesInfoItem}>
                    <Text style={styles.brumesInfoIcon}>🎁</Text>
                    <Text style={styles.brumesInfoText}>
                      Envoyez des cadeaux pendant les lives pour soutenir vos créateurs préférés
                    </Text>
                  </View>
                  <View style={styles.brumesInfoItem}>
                    <Text style={styles.brumesInfoIcon}>⚡</Text>
                    <Text style={styles.brumesInfoText}>
                      Boostez votre profil pour plus de visibilité
                    </Text>
                  </View>
                  <View style={styles.brumesInfoItem}>
                    <Text style={styles.brumesInfoIcon}>💬</Text>
                    <Text style={styles.brumesInfoText}>
                      Démarquez vos messages dans le chat des lives
                    </Text>
                  </View>
                </View>
              </>
            )}

            {/* Ajout d'un indicateur de chargement */}
            {loading && (
              <ActivityIndicator size="large" color="#667eea" style={{ marginTop: 40 }} />
            )}

            <View style={styles.bottomSpacer} />
          </ScrollView>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2d3436',
  },
  brumesBalance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(108,92,231,0.1)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  brumesIcon: {
    fontSize: 18,
  },
  brumesCount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6c5ce7',
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: 'rgba(108,92,231,0.08)',
    borderRadius: 16,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#fff',
    shadowColor: '#6c5ce7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#a0a3bd',
  },
  tabTextActive: {
    color: '#6c5ce7',
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2d3436',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#636e72',
    marginBottom: 20,
  },

  // Subscriptions
  subscriptionCard: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  subscriptionCurrent: {
    opacity: 0.7,
  },
  subscriptionGradient: {
    padding: 20,
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  vipBadge: {
    backgroundColor: 'rgba(255,215,0,0.4)',
  },
  premiumBadge: {
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  popularText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subscriptionEmoji: {
    fontSize: 28,
  },
  subscriptionName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  subscriptionPrice: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
  },
  subscriptionPeriod: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    marginLeft: 2,
  },
  featuresContainer: {
    marginBottom: 16,
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 12,
    padding: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  featureLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  featureValue: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
    flex: 1,
  },
  featureCheck: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    marginRight: 10,
    width: 20,
  },
  featureText: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  currentBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  currentText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  subscribeBtn: {
    backgroundColor: '#fff',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  subscribeBtnText: {
    color: '#6c5ce7',
    fontSize: 16,
    fontWeight: '800',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(108,92,231,0.08)',
    padding: 16,
    borderRadius: 16,
    marginTop: 8,
    gap: 10,
  },
  infoIcon: {
    fontSize: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#636e72',
    lineHeight: 18,
  },

  // Brumes
  brumesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  brumesPack: {
    width: (width - 52) / 2,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(108,92,231,0.15)',
    position: 'relative',
    shadowColor: '#6c5ce7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  brumesPackPopular: {
    borderColor: '#6c5ce7',
    backgroundColor: 'rgba(108,92,231,0.05)',
  },
  packPopularBadge: {
    position: 'absolute',
    top: -10,
    right: 10,
    backgroundColor: '#6c5ce7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  packPopularText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  packIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  packAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2d3436',
  },
  bonusBadge: {
    backgroundColor: 'rgba(76,175,80,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginTop: 4,
  },
  bonusText: {
    color: '#4caf50',
    fontSize: 13,
    fontWeight: '700',
  },
  packPriceContainer: {
    marginTop: 12,
    backgroundColor: '#6c5ce7',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 12,
  },
  packPrice: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  brumesInfoSection: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginTop: 24,
    borderWidth: 1,
    borderColor: 'rgba(108,92,231,0.1)',
  },
  brumesInfoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2d3436',
    marginBottom: 16,
  },
  brumesInfoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
    gap: 12,
  },
  brumesInfoIcon: {
    fontSize: 20,
    width: 30,
  },
  brumesInfoText: {
    flex: 1,
    fontSize: 14,
    color: '#636e72',
    lineHeight: 20,
  },
  bottomSpacer: {
    height: 120,
  },

  // Actions
  actionsContainer: {
    gap: 12,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(108,92,231,0.15)',
    shadowColor: '#6c5ce7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  actionIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: 'rgba(108,92,231,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  actionIcon: {
    fontSize: 24,
  },
  actionContent: {
    flex: 1,
  },
  actionName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2d3436',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 13,
    color: '#636e72',
    lineHeight: 18,
  },
  actionCostContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(108,92,231,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 4,
  },
  actionCostIcon: {
    fontSize: 14,
  },
  actionCost: {
    fontSize: 16,
    fontWeight: '800',
    color: '#6c5ce7',
  },

  // Options payantes
  paidOptionCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  paidOptionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  paidOptionIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  paidOptionIcon: {
    fontSize: 24,
  },
  paidOptionContent: {
    flex: 1,
  },
  paidOptionName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  paidOptionDescription: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 18,
  },
  paidOptionPriceContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  paidOptionPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
  paidOptionPeriod: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
});
