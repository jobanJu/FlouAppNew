import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Image,
  TouchableOpacity,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

interface UserStats {
  id: string;
  user_id: string;
  total_points: number;
  matches_count: number;
  messages_sent: number;
  sessions_created: number;
  posts_count: number;
  badges: string[];
  level: string;
  rank?: number;
}

const BADGES = [
  { id: 'first_match', name: '🎯 Premier Match', description: 'Votre premier match' },
  { id: 'chatter', name: '💬 Bavard', description: '50 messages envoyés' },
  { id: 'content_creator', name: '📸 Créateur', description: '10 posts publiés' },
  { id: 'social_butterfly', name: '🦋 Papillon Social', description: '20 matchs' },
  { id: 'session_organizer', name: '🏄 Organisateur', description: '5 sessions créées' },
  { id: 'wave_rider', name: '🏄‍♂️ Cavalier de Vagues', description: '10 sessions rejointes' },
  { id: 'power_user', name: '⚡ Super Utilisateur', description: '1000 points' },
  { id: 'legend', name: '👑 Légende', description: '5000 points' },
];

export default function GamificationScreen() {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<UserStats[]>([]);
  const [activeTab, setActiveTab] = useState('stats');

  useEffect(() => {
    if (!user?.id) return;

    loadUserStats();
    loadLeaderboard();
  }, [user?.id]);

  const loadUserStats = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      setStats(
        data || {
          id: '',
          user_id: user?.id || '',
          total_points: 0,
          matches_count: 0,
          messages_sent: 0,
          sessions_created: 0,
          posts_count: 0,
          badges: [],
          level: 'Débutant',
        }
      );
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('user_stats')
        .select('*')
        .order('total_points', { ascending: false })
        .limit(20);

      if (error) throw error;
      setLeaderboard(data || []);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Débutant':
        return '#34C759';
      case 'Intermédiaire':
        return '#007AFF';
      case 'Confirmé':
        return '#FF9500';
      case 'Légendaire':
        return '#FF3B30';
      default:
        return '#666';
    }
  };

  const getProgressToNextLevel = () => {
    const levelThresholds: { [key: string]: number } = {
      'Débutant': 0,
      'Intermédiaire': 500,
      'Confirmé': 1500,
      'Légendaire': 3000,
    };

    const currentThreshold = levelThresholds[stats?.level || 'Débutant'];
    const nextLevel = Object.keys(levelThresholds).find(
      (level) => levelThresholds[level] > (stats?.total_points || 0)
    );
    const nextThreshold = levelThresholds[nextLevel || 'Légendaire'];

    return {
      current: stats?.total_points || 0,
      next: nextThreshold,
      progress: ((stats?.total_points || 0) - currentThreshold) / (nextThreshold - currentThreshold),
    };
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </SafeAreaView>
    );
  }

  const progress = getProgressToNextLevel();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF' }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Level Section */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 20, alignItems: 'center' }}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>
            {stats?.level === 'Débutant' && '🥚'}
            {stats?.level === 'Intermédiaire' && '🌱'}
            {stats?.level === 'Confirmé' && '⭐'}
            {stats?.level === 'Légendaire' && '👑'}
          </Text>
          <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 4 }}>
            {stats?.level}
          </Text>
          <Text
            style={{
              color: getLevelColor(stats?.level || 'Débutant'),
              fontSize: 14,
              fontWeight: '600',
              marginBottom: 16,
            }}
          >
            {stats?.total_points} Points
          </Text>

          {/* Progress Bar */}
          <View
            style={{
              width: '100%',
              height: 8,
              backgroundColor: '#F0F0F0',
              borderRadius: 4,
              overflow: 'hidden',
              marginBottom: 8,
            }}
          >
            <View
              style={{
                width: `${Math.min(progress.progress * 100, 100)}%`,
                height: '100%',
                backgroundColor: getLevelColor(stats?.level || 'Débutant'),
              }}
            />
          </View>
          <Text style={{ fontSize: 11, color: '#999' }}>
            {progress.current} / {progress.next} points
          </Text>
        </View>

        {/* Tabs */}
        <View
          style={{
            flexDirection: 'row',
            paddingHorizontal: 16,
            marginBottom: 16,
            borderBottomWidth: 1,
            borderBottomColor: '#F0F0F0',
          }}
        >
          {['stats', 'badges', 'leaderboard'].map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderBottomWidth: activeTab === tab ? 2 : 0,
                borderBottomColor: '#007AFF',
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontWeight: activeTab === tab ? '600' : '400',
                  color: activeTab === tab ? '#007AFF' : '#666',
                }}
              >
                {tab === 'stats' && '📊 Stats'}
                {tab === 'badges' && '🎖️ Badges'}
                {tab === 'leaderboard' && '🏆 Classement'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Content */}
        {activeTab === 'stats' && (
          <View style={{ paddingHorizontal: 16 }}>
            <View
              style={{
                backgroundColor: '#F9F9F9',
                borderRadius: 8,
                padding: 16,
                marginBottom: 12,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  marginBottom: 12,
                }}
              >
                <View style={{ alignItems: 'center', flex: 1 }}>
                  <Text style={{ fontSize: 20, marginBottom: 4 }}>❤️</Text>
                  <Text style={{ fontSize: 20, fontWeight: 'bold' }}>
                    {stats?.matches_count}
                  </Text>
                  <Text style={{ fontSize: 11, color: '#666', marginTop: 2 }}>
                    Matchs
                  </Text>
                </View>
                <View style={{ alignItems: 'center', flex: 1 }}>
                  <Text style={{ fontSize: 20, marginBottom: 4 }}>💬</Text>
                  <Text style={{ fontSize: 20, fontWeight: 'bold' }}>
                    {stats?.messages_sent}
                  </Text>
                  <Text style={{ fontSize: 11, color: '#666', marginTop: 2 }}>
                    Messages
                  </Text>
                </View>
                <View style={{ alignItems: 'center', flex: 1 }}>
                  <Text style={{ fontSize: 20, marginBottom: 4 }}>🏄</Text>
                  <Text style={{ fontSize: 20, fontWeight: 'bold' }}>
                    {stats?.sessions_created}
                  </Text>
                  <Text style={{ fontSize: 11, color: '#666', marginTop: 2 }}>
                    Sessions
                  </Text>
                </View>
                <View style={{ alignItems: 'center', flex: 1 }}>
                  <Text style={{ fontSize: 20, marginBottom: 4 }}>📸</Text>
                  <Text style={{ fontSize: 20, fontWeight: 'bold' }}>
                    {stats?.posts_count}
                  </Text>
                  <Text style={{ fontSize: 11, color: '#666', marginTop: 2 }}>
                    Posts
                  </Text>
                </View>
              </View>
            </View>

            <View style={{ paddingHorizontal: 0 }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#666', marginBottom: 8 }}>
                ACTIVITÉS RÉCENTES
              </Text>
              <View style={{ backgroundColor: '#F9F9F9', borderRadius: 8, padding: 12 }}>
                <Text style={{ color: '#666', fontSize: 13 }}>
                  • +50 points - Nouveau match
                </Text>
                <Text style={{ color: '#666', fontSize: 13, marginTop: 4 }}>
                  • +10 points - Message envoyé
                </Text>
                <Text style={{ color: '#666', fontSize: 13, marginTop: 4 }}>
                  • +100 points - Session créée
                </Text>
                <Text style={{ color: '#666', fontSize: 13, marginTop: 4 }}>
                  • +25 points - Post publié
                </Text>
              </View>
            </View>
          </View>
        )}

        {activeTab === 'badges' && (
          <View style={{ paddingHorizontal: 16 }}>
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              {BADGES.map((badge) => {
                const earned = stats?.badges.includes(badge.id);
                return (
                  <TouchableOpacity
                    key={badge.id}
                    style={{
                      width: '48%',
                      backgroundColor: earned ? '#F9F9F9' : '#FAFAFA',
                      borderRadius: 8,
                      padding: 12,
                      alignItems: 'center',
                      opacity: earned ? 1 : 0.6,
                      borderWidth: 1,
                      borderColor: earned ? '#E0E0E0' : '#F0F0F0',
                    }}
                  >
                    <Text style={{ fontSize: 32, marginBottom: 8 }}>
                      {badge.name.split(' ')[0]}
                    </Text>
                    <Text
                      style={{
                        fontWeight: '600',
                        fontSize: 12,
                        textAlign: 'center',
                        marginBottom: 4,
                      }}
                    >
                      {badge.name.split(' ').slice(1).join(' ')}
                    </Text>
                    <Text
                      style={{
                        fontSize: 11,
                        color: '#999',
                        textAlign: 'center',
                      }}
                    >
                      {badge.description}
                    </Text>
                    {!earned && (
                      <Text
                        style={{
                          fontSize: 10,
                          color: '#999',
                          marginTop: 8,
                          fontStyle: 'italic',
                        }}
                      >
                        Verrouillé
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {activeTab === 'leaderboard' && (
          <View style={{ paddingHorizontal: 16 }}>
            {leaderboard.map((item, index) => (
              <View
                key={item.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: '#F0F0F0',
                }}
              >
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: 'bold',
                    color: '#007AFF',
                    marginRight: 12,
                    width: 30,
                  }}
                >
                  {index === 0 && '🥇'}
                  {index === 1 && '🥈'}
                  {index === 2 && '🥉'}
                  {index > 2 && `#${index + 1}`}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '600', marginBottom: 2 }}>
                    Utilisateur #{item.user_id.substring(0, 8)}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#666' }}>
                    {item.level}
                  </Text>
                </View>
                <Text style={{ fontWeight: 'bold', color: '#007AFF' }}>
                  {item.total_points}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
