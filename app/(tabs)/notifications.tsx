import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  read: boolean;
  created_at: string;
}

export default function NotificationsScreen() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Tous');

  useEffect(() => {
    if (!user?.id) return;

    loadNotifications();
    subscribeToNotifications();
  }, [user?.id]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToNotifications = () => {
    if (!user?.id) return;

    const subscription = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload: any) => {
          setNotifications((prev) => [payload.new, ...prev]);
        }
      )
      .subscribe();

    return subscription;
  };

  const markAsRead = async (id: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);

      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === id ? { ...notif, read: true } : notif
        )
      );
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user?.id)
        .eq('read', false);

      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, read: true }))
      );
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

      setNotifications((prev) => prev.filter((notif) => notif.id !== id));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'match':
        return '❤️';
      case 'message':
        return '💬';
      case 'session':
        return '🏄';
      case 'like':
        return '👍';
      case 'follow':
        return '👤';
      default:
        return '🔔';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'match':
        return '#FF6B6B';
      case 'message':
        return '#4ECDC4';
      case 'session':
        return '#FFD93D';
      case 'like':
        return '#FF6B6B';
      case 'follow':
        return '#6BCB77';
      default:
        return '#007AFF';
    }
  };

  const filteredNotifications =
    filter === 'Tous'
      ? notifications
      : notifications.filter((notif) => notif.type === filter.toLowerCase());

  const unreadCount = notifications.filter((n) => !n.read).length;

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      onPress={() => markAsRead(item.id)}
      style={{
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
        backgroundColor: item.read ? '#FFF' : '#F9F9F9',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <Text style={{ fontSize: 20, marginRight: 12, marginTop: 2 }}>
          {getNotificationIcon(item.type)}
        </Text>

        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: item.read ? '400' : '600',
                color: '#000',
                flex: 1,
              }}
            >
              {item.title}
            </Text>
            {!item.read && (
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: getNotificationColor(item.type),
                }}
              />
            )}
          </View>

          <Text
            style={{
              fontSize: 13,
              color: '#666',
              marginTop: 4,
              lineHeight: 18,
            }}
            numberOfLines={2}
          >
            {item.message}
          </Text>

          <Text
            style={{
              fontSize: 11,
              color: '#999',
              marginTop: 6,
            }}
          >
            {new Date(item.created_at).toLocaleDateString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => deleteNotification(item.id)}
          style={{ padding: 8 }}
        >
          <Text style={{ fontSize: 16 }}>✕</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF' }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={{ backgroundColor: '#FF3B30', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
              <Text style={{ color: '#FFF', fontWeight: '600', fontSize: 12 }}>
                {unreadCount} nouveau{unreadCount > 1 ? 'x' : ''}
              </Text>
            </View>
          )}
        </View>

        {/* Filters */}
        <FlatList
          data={['Tous', 'Match', 'Message', 'Session', 'Like', 'Follow']}
          horizontal
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setFilter(item)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 20,
                backgroundColor: filter === item ? '#007AFF' : '#F0F0F0',
                marginRight: 8,
              }}
            >
              <Text
                style={{
                  color: filter === item ? '#FFF' : '#333',
                  fontWeight: '600',
                  fontSize: 12,
                }}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item}
          scrollEnabled
        />
      </View>

      {/* Notifications List */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : filteredNotifications.length > 0 ? (
        <>
          {unreadCount > 0 && (
            <TouchableOpacity
              onPress={markAllAsRead}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                backgroundColor: '#F0F0F0',
              }}
            >
              <Text
                style={{
                  color: '#007AFF',
                  fontWeight: '600',
                  fontSize: 13,
              }}
              >
                Marquer tout comme lu
              </Text>
            </TouchableOpacity>
          )}
          <FlatList
            data={filteredNotifications}
            renderItem={renderNotification}
            keyExtractor={(item) => item.id}
            scrollEnabled
          />
        </>
      ) : (
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 16, color: '#999', marginBottom: 8 }}>
            🔔
          </Text>
          <Text style={{ fontSize: 14, color: '#666' }}>
            Aucune notification
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}
