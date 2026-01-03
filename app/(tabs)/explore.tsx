import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';

export default function ExploreScreen() {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();

  const fetchMatches = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('matches')
        .select('*, profiles(*)')
        .eq('status', 'matched')
        .limit(50);

      if (error) throw error;
      setMatches(data || []);
    } catch (e: any) {
      Alert.alert('Erreur', e.message || 'Impossible de charger les matches.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchMatches();
    }, [fetchMatches]),
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#faf9ff' }}>
      <SafeAreaView edges={['top']} style={[styles.header, { paddingTop: insets.top }]}>
        <Text style={styles.headerTitle}>Mes Matches</Text>
        <Text style={styles.headerSubtitle}>
          {matches.length} match{matches.length > 1 ? 'es' : ''}
        </Text>
      </SafeAreaView>

      {loading ? (
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color="#667eea" />
        </View>
      ) : (
        <View style={styles.container}>
          {matches.length === 0 ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={styles.emptyText}>Aucun match pour le moment</Text>
              <Text style={styles.emptySubtext}>Retourne au matching pour en trouver !</Text>
            </View>
          ) : (
            <FlatList
              data={matches}
              keyExtractor={(item) => String(item.id)}
              numColumns={2}
              columnWrapperStyle={styles.row}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              renderItem={({ item: match }) => {
                const profile = match.profiles;
                return (
                  <TouchableOpacity style={styles.matchCard}>
                    <Image
                      source={{
                        uri: profile?.avatar_url || 'https://via.placeholder.com/150',
                      }}
                      style={styles.matchImage}
                    />
                    <View style={styles.matchInfo}>
                      <Text style={styles.matchName}>
                        {profile?.first_name || 'Utilisateur'}
                      </Text>
                      <Text style={styles.matchAge}>
                        {profile?.age ? `${profile.age} ans` : ''}
                      </Text>
                      <TouchableOpacity style={styles.messageButton}>
                        <Text style={styles.messageButtonText}>Écrire</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#faf9ff',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#999',
    marginTop: 2,
  },
  container: {
    flex: 1,
    paddingHorizontal: 8,
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  scrollContent: {
    paddingVertical: 12,
  },
  matchCard: {
    width: '48%',
    borderRadius: 16,
    backgroundColor: '#fff',
    overflow: 'hidden',
    shadowColor: '#6c5ce7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  matchImage: {
    width: '100%',
    height: 160,
    backgroundColor: '#e0e0e0',
  },
  matchInfo: {
    padding: 12,
    backgroundColor: '#fff',
  },
  matchName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  matchAge: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  messageButton: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#6c5ce7',
    borderRadius: 8,
    alignItems: 'center',
  },
  messageButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
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


