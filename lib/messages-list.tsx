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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';

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

export default function MessagesListScreen() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  // Fetch current user
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setCurrentUserId(data.user.id);
      }
    };
    getCurrentUser();
  }, []);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!currentUserId) return;

    setLoading(true);
    try {
      // Get conversations where current user is involved
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

      // Transform data to get other user info
      const transformedConversations = (data || []).map((conv: any) => ({
        ...conv,
        other_user: conv.user1_id === currentUserId ? conv.user2 : conv.user1,
      }));

      setConversations(transformedConversations);
    } catch (e: any) {
      Alert.alert('Erreur', e.message || 'Impossible de charger les messages');
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  // Load conversations on mount
  useEffect(() => {
    if (currentUserId) {
      fetchConversations();
    }
  }, [currentUserId, fetchConversations]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!currentUserId) return;

    const subscription = supabase
      .channel(`conversations:${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `user1_id=eq.${currentUserId}`,
        },
        () => fetchConversations(),
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `user2_id=eq.${currentUserId}`,
        },
        () => fetchConversations(),
      )
      .subscribe();

    return () => subscription.unsubscribe();
  }, [currentUserId, fetchConversations]);

  const handleConversationPress = (conversationId: string) => {
    // TODO: Navigate to chat screen
    console.log('Open conversation:', conversationId);
  };

  const renderConversation = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => handleConversationPress(item.id)}>
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
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.title}>Messages</Text>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#667eea" />
        </View>
      ) : conversations.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>Aucun message</Text>
          <Text style={styles.emptySubtext}>Tes matchs apparaîtront ici</Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderConversation}
          keyExtractor={(item) => item.id}
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
    backgroundColor: '#faf9ff',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#000',
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
    borderBottomColor: '#f0f0f0',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
    backgroundColor: '#e0e0e0',
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 13,
    color: '#999',
    lineHeight: 18,
  },
  badge: {
    backgroundColor: '#6c5ce7',
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
});
