import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

interface Session {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  scheduled_at: string;
  location: string;
  lat: number;
  lng: number;
  max_participants: number;
  level: string;
  conditions: string;
  participants_count: number;
  creator?: {
    first_name: string;
    avatar_url?: string;
  };
  is_participant?: boolean;
}

export default function SessionsScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLevel, setFilterLevel] = useState('Tous');
  const [showUpcoming, setShowUpcoming] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      loadSessions();
    }, [])
  );

  const loadSessions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          id,
          creator_id,
          title,
          description,
          scheduled_at,
          location,
          lat,
          lng,
          max_participants,
          level,
          conditions,
          participants_count,
          creator:profiles(first_name, avatar_url)
        `)
        .order('scheduled_at', { ascending: true })
        .limit(100);

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const joinSession = async (sessionId: string) => {
    try {
      const { error: joinError } = await supabase
        .from('session_participants')
        .insert([
          {
            session_id: sessionId,
            user_id: user?.id,
          },
        ]);

      if (joinError) throw joinError;

      // Update local state
      setSessions((prev) =>
        prev.map((session) =>
          session.id === sessionId
            ? {
                ...session,
                participants_count: session.participants_count + 1,
                is_participant: true,
              }
            : session
        )
      );
    } catch (error) {
      console.error('Error joining session:', error);
    }
  };

  const leaveSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('session_participants')
        .delete()
        .eq('session_id', sessionId)
        .eq('user_id', user?.id);

      if (error) throw error;

      // Update local state
      setSessions((prev) =>
        prev.map((session) =>
          session.id === sessionId
            ? {
                ...session,
                participants_count: Math.max(0, session.participants_count - 1),
                is_participant: false,
              }
            : session
        )
      );
    } catch (error) {
      console.error('Error leaving session:', error);
    }
  };

  const filteredSessions = sessions.filter((session) => {
    const now = new Date();
    const sessionDate = new Date(session.scheduled_at);
    const isUpcoming = sessionDate > now;

    if (filterLevel !== 'Tous' && session.level !== filterLevel) return false;
    if (showUpcoming && !isUpcoming) return false;

    return true;
  });

  const renderSession = ({ item }: { item: Session }) => {
    const sessionDate = new Date(item.scheduled_at);
    const canJoin = item.participants_count < item.max_participants;

    return (
      <TouchableOpacity
        style={{
          backgroundColor: '#F9F9F9',
          marginBottom: 12,
          borderRadius: 8,
          overflow: 'hidden',
        }}
      >
        <View style={{ padding: 12 }}>
          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: 12,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 4 }}>
                {item.title}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {item.creator?.avatar_url && (
                  <Image
                    source={{ uri: item.creator.avatar_url }}
                    style={{ width: 24, height: 24, borderRadius: 12 }}
                  />
                )}
                <Text style={{ fontSize: 12, color: '#666' }}>
                  par {item.creator?.first_name}
                </Text>
              </View>
            </View>
            <View
              style={{
                backgroundColor: '#E8F4FF',
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 4,
              }}
            >
              <Text style={{ fontSize: 11, color: '#007AFF', fontWeight: '600' }}>
                {item.level}
              </Text>
            </View>
          </View>

          {/* Details */}
          <View
            style={{
              backgroundColor: '#FFF',
              padding: 8,
              borderRadius: 6,
              marginBottom: 12,
            }}
          >
            <Text style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>
              📅 {sessionDate.toLocaleDateString('fr-FR', { weekday: 'short', month: 'short', day: 'numeric' })} à{' '}
              {sessionDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </Text>
            <Text style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>
              📍 {item.location}
            </Text>
            <Text style={{ fontSize: 11, color: '#666' }}>
              👥 {item.participants_count}/{item.max_participants} participants
            </Text>
          </View>

          {/* Description */}
          <Text
            style={{
              fontSize: 13,
              color: '#666',
              lineHeight: 18,
              marginBottom: 12,
            }}
            numberOfLines={2}
          >
            {item.description || 'Aucune description'}
          </Text>

          {/* Conditions */}
          <View
            style={{
              backgroundColor: '#FFF',
              padding: 8,
              borderRadius: 6,
              marginBottom: 12,
            }}
          >
            <Text style={{ fontSize: 11, color: '#666', fontWeight: '600' }}>
              Conditions: {item.conditions}
            </Text>
          </View>

          {/* Action Button */}
          <TouchableOpacity
            onPress={() =>
              item.is_participant
                ? leaveSession(item.id)
                : joinSession(item.id)
            }
            disabled={!canJoin && !item.is_participant}
            style={{
              paddingVertical: 10,
              backgroundColor: item.is_participant
                ? '#FF3B30'
                : canJoin
                ? '#34C759'
                : '#CCCCCC',
              borderRadius: 6,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#FFF', fontWeight: '600', fontSize: 14 }}>
              {item.is_participant
                ? '✓ Inscrit'
                : canJoin
                ? 'Rejoindre'
                : 'Complet'}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF' }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: '#F0F0F0',
        }}
      >
        <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Sessions</Text>
        <TouchableOpacity
          onPress={() => router.push('/session/create')}
          style={{
            backgroundColor: '#007AFF',
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 6,
          }}
        >
          <Text style={{ color: '#FFF', fontWeight: '600' }}>+ Créer</Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 12, gap: 12 }}>
        {/* Level Filter */}
        <View>
          <Text style={{ fontSize: 12, fontWeight: '600', color: '#666', marginBottom: 8 }}>
            NIVEAU
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {['Tous', 'Débutant', 'Intermédiaire', 'Confirmé'].map((level) => (
              <TouchableOpacity
                key={level}
                onPress={() => setFilterLevel(level)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 20,
                  backgroundColor: filterLevel === level ? '#007AFF' : '#F0F0F0',
                }}
              >
                <Text
                  style={{
                    color: filterLevel === level ? '#FFF' : '#333',
                    fontWeight: '600',
                    fontSize: 12,
                  }}
                >
                  {level}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* View Toggle */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity
            onPress={() => setShowUpcoming(true)}
            style={{
              flex: 1,
              paddingVertical: 8,
              backgroundColor: showUpcoming ? '#007AFF' : '#F0F0F0',
              borderRadius: 6,
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                color: showUpcoming ? '#FFF' : '#333',
                fontWeight: '600',
                fontSize: 12,
              }}
            >
              À venir
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowUpcoming(false)}
            style={{
              flex: 1,
              paddingVertical: 8,
              backgroundColor: !showUpcoming ? '#007AFF' : '#F0F0F0',
              borderRadius: 6,
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                color: !showUpcoming ? '#FFF' : '#333',
                fontWeight: '600',
                fontSize: 12,
              }}
            >
              Passées
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Sessions List */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : filteredSessions.length > 0 ? (
        <FlatList
          data={filteredSessions}
          renderItem={renderSession}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
          scrollEnabled
        />
      ) : (
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 16, color: '#999', marginBottom: 8 }}>
            🏄
          </Text>
          <Text style={{ fontSize: 14, color: '#666' }}>
            Aucune session trouvée
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}
