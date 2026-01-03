import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { getMessages, sendMessage } from '@/lib/messages';
import { useAuth } from '@/hooks/useAuth';

interface Message {
  id: string;
  user_id: string;
  content: string;
  image_url?: string;
  created_at: string;
  read_at?: string;
  sender?: {
    id: string;
    first_name: string;
    avatar_url?: string;
  };
}

interface TypingIndicator {
  user_id: string;
  is_typing: boolean;
}

export default function ChatScreen() {
  const { id: conversationId } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!conversationId || !user?.id) return;

    loadMessages();
    subscribeToMessages();
    subscribeToTypingIndicator();

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [conversationId, user?.id]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const data = await getMessages(conversationId as string, 50);
      setMessages(data.reverse());
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    if (!conversationId) return;

    const subscription = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload: any) => {
          const newMessage = payload.new as Message;
          // Fetch sender info
          const { data: sender } = await supabase
            .from('profiles')
            .select('id, first_name, avatar_url')
            .eq('user_id', newMessage.user_id)
            .single();
          
          setMessages((prev) => [...prev, { ...newMessage, sender }]);
          flatListRef.current?.scrollToEnd({ animated: true });
        }
      )
      .subscribe();

    return subscription;
  };

  const subscribeToTypingIndicator = () => {
    if (!conversationId) return;

    supabase
      .channel(`typing:${conversationId}`)
      .on(
        'broadcast',
        { event: 'typing' },
        (payload: any) => {
          if (payload.payload.user_id !== user?.id) {
            setOtherUserTyping(payload.payload.is_typing);
          }
        }
      )
      .subscribe();
  };

  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      broadcastTypingStatus(true);
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      broadcastTypingStatus(false);
    }, 3000);
  };

  const broadcastTypingStatus = (typing: boolean) => {
    if (!conversationId || !user?.id) return;

    supabase
      .channel(`typing:${conversationId}`)
      .send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          user_id: user.id,
          is_typing: typing,
        },
      });
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !conversationId || !user?.id) return;

    try {
      const content = messageText.trim();
      setMessageText('');
      
      await sendMessage(conversationId as string, user.id, content);
      broadcastTypingStatus(false);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessageText(messageText); // Restore text on error
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwnMessage = item.user_id === user?.id;

    return (
      <View
        style={{
          marginVertical: 8,
          marginHorizontal: 12,
          flexDirection: isOwnMessage ? 'row-reverse' : 'row',
          alignItems: 'flex-end',
        }}
      >
        {item.sender?.avatar_url && !isOwnMessage && (
          <Image
            source={{ uri: item.sender.avatar_url }}
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              marginHorizontal: 8,
            }}
          />
        )}
        <View
          style={{
            maxWidth: '75%',
            backgroundColor: isOwnMessage ? '#007AFF' : '#E5E5EA',
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: 8,
          }}
        >
          {item.image_url && (
            <Image
              source={{ uri: item.image_url }}
              style={{
                width: 200,
                height: 200,
                borderRadius: 8,
                marginBottom: 4,
              }}
            />
          )}
          <Text
            style={{
              color: isOwnMessage ? '#FFF' : '#000',
              fontSize: 16,
              lineHeight: 20,
            }}
          >
            {item.content}
          </Text>
          <Text
            style={{
              color: isOwnMessage ? '#E0E0E0' : '#999',
              fontSize: 11,
              marginTop: 4,
              alignSelf: 'flex-end',
            }}
          >
            {new Date(item.created_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
            {isOwnMessage && item.read_at && ' ✓✓'}
            {isOwnMessage && !item.read_at && ' ✓'}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF' }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        ) : (
          <>
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={renderMessage}
              onEndReached={() => {
                if (messages.length > 0) {
                  flatListRef.current?.scrollToEnd({ animated: true });
                }
              }}
              ListEmptyComponent={
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ color: '#999' }}>Aucun message pour le moment</Text>
                </View>
              }
            />

            {otherUserTyping && (
              <View style={{ paddingHorizontal: 12, paddingVertical: 4 }}>
                <Text style={{ fontSize: 12, color: '#999', fontStyle: 'italic' }}>
                  Utilisateur en train d'écrire...
                </Text>
              </View>
            )}

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderTopWidth: 1,
                borderTopColor: '#E5E5EA',
              }}
            >
              <TextInput
                style={{
                  flex: 1,
                  borderRadius: 20,
                  backgroundColor: '#F2F2F2',
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  marginRight: 8,
                  maxHeight: 100,
                  fontSize: 16,
                }}
                placeholder="Message..."
                placeholderTextColor="#999"
                value={messageText}
                onChangeText={(text) => {
                  setMessageText(text);
                  handleTyping();
                }}
                multiline
              />
              <TouchableOpacity
                onPress={handleSendMessage}
                disabled={!messageText.trim()}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: messageText.trim() ? '#007AFF' : '#E5E5EA',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 18, color: '#FFF' }}>⬆️</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
