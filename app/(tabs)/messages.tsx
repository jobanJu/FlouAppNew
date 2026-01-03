import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import HideKeyboardArrow from '../../components/HideKeyboardArrow';

const { width } = Dimensions.get('window');

// Coûts en Brumes
const BRUMES_COSTS = {
  vocal: 300,
  reseaux: 100,
  defloutage: 100,
  boost: 300,
};

// Conversations mock
const CONVERSATIONS = [
  { 
    id: '1', 
    name: 'Emma', 
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
    lastMsg: 'Salut ! On se voit bientôt ?', 
    time: '12:34', 
    unread: 2,
    online: true,
    matched: '2 jours',
  },
  { 
    id: '2', 
    name: 'Lucas', 
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    lastMsg: 'Merci pour hier soir 😊', 
    time: '10:20', 
    unread: 0,
    online: false,
    matched: '1 semaine',
  },
  { 
    id: '3', 
    name: 'Chloé', 
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100',
    lastMsg: 'Tu fais quoi ce weekend ?', 
    time: 'Hier', 
    unread: 1,
    online: true,
    matched: '3 jours',
  },
  { 
    id: '4', 
    name: 'Thomas', 
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
    lastMsg: '🎸', 
    time: 'Hier', 
    unread: 0,
    online: false,
    matched: '5 jours',
  },
];

// Messages mock pour une conversation
const MOCK_MESSAGES: Record<string, Array<{ id: string; text: string; sender: 'me' | 'them'; time: string; type?: 'text' | 'voice' | 'image' }>> = {
  '1': [
    { id: '1', text: 'Hey Emma ! 👋', sender: 'me', time: '12:30' },
    { id: '2', text: 'Coucou ! Comment tu vas ?', sender: 'them', time: '12:31' },
    { id: '3', text: 'Super bien ! J\'ai vu que tu aimais l\'art aussi', sender: 'me', time: '12:32' },
    { id: '4', text: 'Oui ! J\'adore peindre 🎨', sender: 'them', time: '12:33' },
    { id: '5', text: 'Salut ! On se voit bientôt ?', sender: 'them', time: '12:34' },
  ],
  '2': [
    { id: '1', text: 'C\'était cool hier !', sender: 'them', time: '10:15' },
    { id: '2', text: 'Grave ! On remet ça ?', sender: 'me', time: '10:18' },
    { id: '3', text: 'Merci pour hier soir 😊', sender: 'them', time: '10:20' },
  ],
  '3': [
    { id: '1', text: 'Hello Chloé !', sender: 'me', time: 'Hier' },
    { id: '2', text: 'Tu fais quoi ce weekend ?', sender: 'them', time: 'Hier' },
  ],
  '4': [
    { id: '1', text: 'Tu joues de quel instrument ?', sender: 'me', time: 'Hier' },
    { id: '2', text: '🎸', sender: 'them', time: 'Hier' },
  ],
};

export default function MessagesScreen() {
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<typeof MOCK_MESSAGES[string]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [myBrumes, setMyBrumes] = useState(100); // Synchronisé avec le shop
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Fonction pour débloquer les réseaux sociaux
  const handleUnlockSocial = () => {
    if (myBrumes < BRUMES_COSTS.reseaux) {
      Alert.alert(
        '🔓 Brumes insuffisantes',
        `Le déblocage des réseaux coûte ${BRUMES_COSTS.reseaux} brumes.\nVous avez ${myBrumes} brumes.`,
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Acheter des Brumes', onPress: () => router.push('/(tabs)/shop') }
        ]
      );
      return;
    }

    Alert.alert(
      '🔓 Débloquer les réseaux',
      `Voir l'Instagram/Snapchat de ${currentConv?.name} ?\nCoût: ${BRUMES_COSTS.reseaux} brumes`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Débloquer', 
          onPress: () => {
            setMyBrumes(prev => prev - BRUMES_COSTS.reseaux);
            Alert.alert('✅ Réseaux débloqués !', `📸 @${currentConv?.name?.toLowerCase()}_insta\n👻 ${currentConv?.name?.toLowerCase()}_snap`);
          }
        },
      ]
    );
  };

  // Fonction pour envoyer un vocal (coûte 300 Brumes)
  const handleSendVocal = () => {
    if (myBrumes < BRUMES_COSTS.vocal) {
      Alert.alert(
        '🧊 Brumes insuffisantes',
        `L'envoi de vocaux coûte ${BRUMES_COSTS.vocal} brumes.\nVous avez ${myBrumes} brumes.`,
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Acheter des Brumes', onPress: () => router.push('/(tabs)/shop') }
        ]
      );
      return;
    }

    Alert.alert(
      '🧊 Envoyer un vocal',
      `Cela coûtera ${BRUMES_COSTS.vocal} brumes.\nSolde actuel: ${myBrumes} ☁️`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Enregistrer',
          onPress: () => {
            setMyBrumes(prev => prev - BRUMES_COSTS.vocal);
            // Simuler l'envoi d'un vocal
            const newMessage = {
              id: Date.now().toString(),
              text: '🎤 Message vocal (0:12)',
              sender: 'me' as const,
              time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
              type: 'voice' as const,
            };
            setMessages(prev => [...prev, newMessage]);
            Alert.alert('✅ Vocal envoyé !', 'Votre message vocal a été envoyé.');
          }
        },
      ]
    );
  };

  useEffect(() => {
    if (activeConversation) {
      setLoading(true);
      setMessages(MOCK_MESSAGES[activeConversation] || []);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setLoading(false));
    }
  }, [activeConversation]);

  const sendMessage = () => {
    if (!inputText.trim()) return;
    
    const newMessage = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: 'me' as const,
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    };
    
    setMessages(prev => [...prev, newMessage]);
    setInputText('');
    
    // Scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    // Simulate typing response
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const responses = [
        'Super ! 😊',
        'Je vois ce que tu veux dire',
        'Ah oui ? Raconte-moi plus !',
        'C\'est génial ça !',
        '👍',
        'On en reparle bientôt ?',
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        text: randomResponse,
        sender: 'them',
        time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      }]);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }, 1500 + Math.random() * 1500);
  };

  const currentConv = CONVERSATIONS.find(c => c.id === activeConversation);

  // Liste des conversations
  if (!activeConversation) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#faf9ff', '#f0eeff', '#ffe9f2']} style={StyleSheet.absoluteFill} />
        
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.header}>
            <Text style={styles.title}>Messages</Text>
            <Text style={styles.subtitle}>{CONVERSATIONS.filter(c => c.unread > 0).length} non lus</Text>
          </View>

          {/* New matches section */}
          <View style={styles.newMatchesSection}>
            <Text style={styles.sectionTitle}>Nouveaux matchs</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.matchesRow}>
              {CONVERSATIONS.map((conv) => (
                <TouchableOpacity 
                  key={conv.id} 
                  style={styles.newMatchItem}
                  onPress={() => setActiveConversation(conv.id)}
                >
                  <View style={styles.newMatchAvatarContainer}>
                    <Image 
                      source={{ uri: conv.avatar }} 
                      style={styles.newMatchAvatar}
                      blurRadius={8}
                    />
                    {conv.online && <View style={styles.onlineDot} />}
                  </View>
                  <Text style={styles.newMatchName}>{conv.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <ScrollView contentContainerStyle={styles.listContent}>
            <Text style={styles.sectionTitle}>Conversations</Text>
            {CONVERSATIONS.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyIcon}>💬</Text>
                <Text style={styles.emptyText}>Aucune conversation</Text>
                <Text style={styles.emptyHint}>Commence à matcher pour discuter !</Text>
              </View>
            ) : (
              CONVERSATIONS.map((conv) => (
                <TouchableOpacity 
                  key={conv.id} 
                  style={styles.card}
                  onPress={() => setActiveConversation(conv.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.cardRow}>
                    <View style={styles.avatarContainer}>
                      <Image 
                        source={{ uri: conv.avatar }} 
                        style={styles.avatar}
                        blurRadius={6}
                      />
                      {conv.online && <View style={styles.onlineDotSmall} />}
                    </View>
                    <View style={styles.cardContent}>
                      <View style={styles.cardTopRow}>
                        <Text style={styles.name}>{conv.name}</Text>
                        <Text style={styles.time}>{conv.time}</Text>
                      </View>
                      <Text style={styles.lastMsg} numberOfLines={1}>{conv.lastMsg}</Text>
                    </View>
                    {conv.unread > 0 && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{conv.unread}</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  // Chat view
  return (
    <View style={styles.container}>
      <LinearGradient colors={['#faf9ff', '#f0eeff', '#fff']} style={StyleSheet.absoluteFill} />
      
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Chat Header */}
        <View style={styles.chatHeader}>
          <TouchableOpacity 
            style={styles.backBtn}
            onPress={() => setActiveConversation(null)}
          >
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.chatHeaderInfo}>
            <View style={styles.chatAvatarContainer}>
              <Image 
                source={{ uri: currentConv?.avatar }} 
                style={styles.chatAvatar}
                blurRadius={6}
              />
              {currentConv?.online && <View style={styles.onlineDotSmall} />}
            </View>
            <View>
              <Text style={styles.chatName}>{currentConv?.name}</Text>
              <Text style={styles.chatStatus}>
                {currentConv?.online ? '🟢 En ligne' : `Match il y a ${currentConv?.matched}`}
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.chatHeaderActions}>
            <TouchableOpacity style={styles.headerActionBtn} onPress={handleUnlockSocial}>
              <Text style={styles.headerActionIcon}>🔓</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Brumes balance */}
        <View style={styles.brumesBar}>
          <Text style={styles.brumesBarIcon}>☁️</Text>
          <Text style={styles.brumesBarText}>{myBrumes} Brumes</Text>
        </View>

        {/* Messages */}
        <ScrollView 
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Match info */}
          <View style={styles.matchInfoCard}>
            <Image 
              source={{ uri: currentConv?.avatar }} 
              style={styles.matchInfoAvatar}
              blurRadius={10}
            />
            <Text style={styles.matchInfoText}>
              Tu as matché avec {currentConv?.name} il y a {currentConv?.matched}
            </Text>
            <Text style={styles.matchInfoHint}>
              Envoie un message pour briser la glace ! 💬
            </Text>
          </View>

          {messages.map((msg) => (
            <View 
              key={msg.id} 
              style={[
                styles.messageBubble,
                msg.sender === 'me' ? styles.myMessage : styles.theirMessage
              ]}
            >
              <Text style={[
                styles.messageText,
                msg.sender === 'me' ? styles.myMessageText : styles.theirMessageText
              ]}>
                {msg.text}
              </Text>
              <Text style={[
                styles.messageTime,
                msg.sender === 'me' ? styles.myMessageTime : styles.theirMessageTime
              ]}>
                {msg.time}
              </Text>
            </View>
          ))}

          {isTyping && (
            <View style={[styles.messageBubble, styles.theirMessage, styles.typingBubble]}>
              <Text style={styles.typingText}>...</Text>
            </View>
          )}

          {/* Ajout d'un indicateur de chargement */}
          {loading && (
            <ActivityIndicator size="large" color="#667eea" style={{ marginTop: 40 }} />
          )}
        </ScrollView>

        {/* Input */}
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <View style={styles.inputContainer}>
            <TouchableOpacity style={styles.inputActionBtn} onPress={handleSendVocal}>
              <Text style={styles.inputActionIcon}>🎤</Text>
              <View style={styles.brumeCostBadge}>
                <Text style={styles.brumeCostText}>{BRUMES_COSTS.vocal}</Text>
              </View>
            </TouchableOpacity>
            
            <View style={styles.inputWrapper}>
              <HideKeyboardArrow />
              <TextInput
                style={styles.input}
                placeholder="Écris un message..."
                placeholderTextColor="#999"
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={500}
              />
            </View>
            
            <TouchableOpacity 
              style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
              onPress={() => { Keyboard.dismiss(); sendMessage(); }}
              disabled={!inputText.trim()}
            >
              <LinearGradient
                colors={inputText.trim() ? ['#667eea', '#764ba2'] : ['#ccc', '#ccc']}
                style={styles.sendBtnGradient}
              >
                <Text style={styles.sendBtnIcon}>➤</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
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
    paddingHorizontal: 20, 
    paddingTop: 10,
    paddingBottom: 16,
  },
  title: { 
    color: '#1b1b1b', 
    fontSize: 32, 
    fontWeight: '800',
  },
  subtitle: { 
    color: '#667eea', 
    marginTop: 4,
    fontWeight: '600',
  },

  // New matches section
  newMatchesSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#666',
    marginBottom: 12,
    paddingHorizontal: 20,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  matchesRow: {
    paddingHorizontal: 16,
    gap: 16,
  },
  newMatchItem: {
    alignItems: 'center',
    gap: 6,
  },
  newMatchAvatarContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: '#667eea',
    padding: 2,
  },
  newMatchAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
  },
  newMatchName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },

  // List
  listContent: { 
    gap: 10, 
    paddingHorizontal: 20, 
    paddingBottom: 120,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyIcon: { 
    fontSize: 48, 
    marginBottom: 8,
  },
  emptyText: { 
    color: '#1f2433', 
    fontSize: 18, 
    fontWeight: '700',
  },
  emptyHint: { 
    color: '#666', 
    fontSize: 14,
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 18,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#fff',
  },
  onlineDotSmall: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#fff',
  },
  cardContent: { 
    flex: 1, 
    gap: 4,
  },
  cardTopRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
  },
  name: { 
    color: '#1f2433', 
    fontSize: 17, 
    fontWeight: '700',
  },
  time: { 
    color: '#999', 
    fontSize: 12,
  },
  lastMsg: { 
    color: '#666', 
    fontSize: 14,
  },
  badge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#667eea',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  badgeText: { 
    color: '#fff', 
    fontSize: 12, 
    fontWeight: '700',
  },

  // Chat Header
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 28,
    color: '#333',
    marginTop: -2,
  },
  chatHeaderInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
    gap: 12,
  },
  chatAvatarContainer: {
    position: 'relative',
  },
  chatAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  chatName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#333',
  },
  chatStatus: {
    fontSize: 12,
    color: '#666',
  },
  chatHeaderActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActionIcon: {
    fontSize: 18,
  },

  // Messages
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 20,
  },
  matchInfoCard: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 20,
  },
  matchInfoAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  matchInfoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  matchInfoHint: {
    fontSize: 13,
    color: '#999',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 8,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#667eea',
    borderBottomRightRadius: 4,
  },
  theirMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#f0f0f5',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  myMessageText: {
    color: '#fff',
  },
  theirMessageText: {
    color: '#333',
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
  },
  myMessageTime: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'right',
  },
  theirMessageTime: {
    color: '#999',
  },
  typingBubble: {
    paddingVertical: 14,
  },
  typingText: {
    fontSize: 20,
    color: '#666',
    letterSpacing: 2,
  },

  // Input
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 12,
    paddingBottom: 30,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    gap: 8,
  },
  inputActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputActionIcon: {
    fontSize: 18,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: '#f0f0f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
  },
  input: {
    fontSize: 15,
    color: '#333',
    maxHeight: 80,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
  sendBtnGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnIcon: {
    fontSize: 18,
    color: '#fff',
  },

  // Brumes
  brumesBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(102,126,234,0.1)',
    paddingVertical: 6,
    gap: 6,
  },
  brumesBarIcon: {
    fontSize: 14,
  },
  brumesBarText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#667eea',
  },
  brumeCostBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#667eea',
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  brumeCostText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
});
