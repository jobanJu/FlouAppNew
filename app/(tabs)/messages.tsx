import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  TextInput,
  Platform,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HideKeyboardArrow from '../../components/HideKeyboardArrow';
import theme from '@/constants/theme';
import { supabase } from '../../lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useMatches } from '@/hooks/useMatches';
import { usePendingSocialRequests } from '@/hooks/useSocialRequests';
import { SocialRequestModal } from '@/components/SocialRequestModal';
import { SocialRequest } from '@/lib/social-requests';

interface Conversation {
  id: string;
  user1_id: string;
  user2_id: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
  other_user: {
    id: string;
    first_name: string;
    avatar_url: string;
  };
}

interface Message {
  id: string;
  conversation_id: string;
  user_id: string;
  content: string;
  image_url?: string;
  read_at?: string;
  created_at: string;
}

type ScreenState = 'list' | 'chat';

export default function MessagesScreen() {
  const [screenState, setScreenState] = useState<ScreenState>('list');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [activeChat, setActiveChat] = useState<Conversation | null>(null);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const insets = useSafeAreaInsets();

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setCurrentUserId(data.user.id);
      }
    };
    getUser();
  }, []);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!currentUserId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(
          `
          id,
          user1_id,
          user2_id,
          last_message,
          last_message_at,
          unread_count,
          user1:profiles!conversations_user1_id_fkey(id, first_name, avatar_url),
          user2:profiles!conversations_user2_id_fkey(id, first_name, avatar_url)
        `
        )
        .or(`user1_id.eq.${currentUserId},user2_id.eq.${currentUserId}`)
        .order('last_message_at', { ascending: false });

      if (error) throw error;

      const transformed = (data || []).map((conv: any) => ({
        ...conv,
        other_user: conv.user1_id === currentUserId ? conv.user2 : conv.user1,
      }));

      setConversations(transformed);
    } catch (e: any) {
      Alert.alert('Erreur', e.message);
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  // Fetch messages for active chat
  const fetchMessages = useCallback(async () => {
    if (!activeChat) return;
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', activeChat.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // Mark as read
      if (currentUserId) {
        await supabase
          .from('messages')
          .update({ read_at: new Date().toISOString() })
          .eq('conversation_id', activeChat.id)
          .neq('user_id', currentUserId);
      }
    } catch (e: any) {
      Alert.alert('Erreur', e.message);
    }
  }, [activeChat, currentUserId]);

  // Load conversations
  useEffect(() => {
    if (currentUserId) {
      fetchConversations();
    }
  }, [currentUserId, fetchConversations]);

  // Load messages when chat opens
  useEffect(() => {
    if (screenState === 'chat' && activeChat) {
      fetchMessages();
    }
  }, [screenState, activeChat, fetchMessages]);

  // Real-time conversations
  useEffect(() => {
    if (!currentUserId) return;
    const subscription = supabase
      .channel(`conversations:${currentUserId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations' },
        () => fetchConversations(),
      )
      .subscribe((status) => {});
    
    return () => {
      subscription.unsubscribe();
    };
  }, [currentUserId, fetchConversations]);

  // Real-time messages
  useEffect(() => {
    if (!activeChat) return;
    const subscription = supabase
      .channel(`messages:${activeChat.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload: any) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        },
      )
      .subscribe((status) => {});
    
    return () => {
      subscription.unsubscribe();
    };
  }, [activeChat?.id]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || !currentUserId || !activeChat) return;

    setSending(true);
    try {
      await supabase.from('messages').insert({
        conversation_id: activeChat.id,
        user_id: currentUserId,
        content: inputText,
      });

      await supabase
        .from('conversations')
        .update({
          last_message: inputText,
          last_message_at: new Date().toISOString(),
        })
        .eq('id', activeChat.id);

      setInputText('');
    } catch (e: any) {
      Alert.alert('Erreur', e.message);
    } finally {
      setSending(false);
    }
  };

  if (screenState === 'chat' && activeChat) {
    return (
      <KeyboardAvoidingView
        style={[styles.container, { paddingTop: insets.top }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        {/* Chat Header */}
        <View style={styles.chatHeader}>
          <TouchableOpacity
            onPress={() => setScreenState('list')}
            style={styles.backButton}>
            <Text style={styles.backButtonText}>‹</Text>
          </TouchableOpacity>
          <Image
            source={{ uri: activeChat.other_user.avatar_url || 'https://via.placeholder.com/40' }}
            style={styles.headerAvatar}
          />
          <Text style={styles.chatName}>{activeChat.other_user.first_name}</Text>
        </View>

        {/* Messages List */}
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View
              style={[
                styles.messageRow,
                item.user_id === currentUserId && styles.ownMessage,
              ]}>
              <View
                style={[
                  styles.messageBubble,
                  item.user_id === currentUserId ? styles.ownBubble : styles.otherBubble,
                ]}>
                <Text
                  style={[
                    styles.messageText,
                    item.user_id === currentUserId && styles.ownText,
                  ]}>
                  {item.content}
                </Text>
              </View>
            </View>
          )}
          contentContainerStyle={styles.messagesContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Commence la conversation</Text>
            </View>
          }
        />

        {/* Input */}
        <View style={[styles.inputContainer, { paddingBottom: insets.bottom }]}>
          <TextInput
            style={styles.input}
            placeholder="Message..."
            value={inputText}
            onChangeText={setInputText}
            multiline
            editable={!sending}
            placeholderTextColor={theme.colors.muted}
          />
          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={handleSendMessage}
            disabled={!inputText.trim() || sending}>
            <Text style={styles.sendButtonText}>→</Text>
          </TouchableOpacity>
          <HideKeyboardArrow />
        </View>
      </KeyboardAvoidingView>
    );
  }

  // Conversations List
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.title}>Messages</Text>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : conversations.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>Aucun message</Text>
          <Text style={styles.emptySubtext}>Tes matchs apparaîtront ici</Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.conversationItem}
              onPress={() => {
                setActiveChat(item);
                setScreenState('chat');
              }}>
              <Image
                source={{ uri: item.other_user.avatar_url || 'https://via.placeholder.com/60' }}
                style={styles.avatar}
              />
              <View style={styles.content}>
                <Text style={styles.name}>{item.other_user.first_name}</Text>
                <Text numberOfLines={1} style={styles.lastMessage}>
                  {item.last_message}
                </Text>
              </View>
              {item.unread_count > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.unread_count}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: theme.colors.text,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
    backgroundColor: theme.colors.border,
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 13,
    color: theme.colors.muted,
    lineHeight: 18,
  },
  badge: {
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  backButton: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  backButtonText: {
    fontSize: 24,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginLeft: 12,
    backgroundColor: theme.colors.border,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginLeft: 12,
  },
  messagesContainer: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 12,
    justifyContent: 'flex-start',
  },
  ownMessage: {
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  otherBubble: {
    backgroundColor: theme.colors.surface,
  },
  ownBubble: {
    backgroundColor: theme.colors.primary,
  },
  messageText: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 18,
  },
  ownText: {
    color: '#fff',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 8,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    fontSize: 14,
    color: theme.colors.text,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: theme.colors.border,
    opacity: 0.5,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
});
