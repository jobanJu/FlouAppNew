import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ExploreScreen() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [brumes, setBrumes] = useState(0); // À remplacer par la vraie source si besoin
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const fetchProfiles = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.from('profiles').select('*').limit(20);
        if (error) throw error;
        setProfiles(data || []);
      } catch (e: any) {
        Alert.alert('Erreur', e.message || 'Impossible de charger les profils.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfiles();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#faf9ff' }}>
      {/* Header sticky */}
      <SafeAreaView edges={['top']} style={[styles.header, { paddingTop: insets.top }]}> 
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Flou</Text>
          <View style={styles.brumesContainer}>
            <Text style={styles.brumesIcon}>☁️</Text>
            <Text style={styles.brumesCount}>{brumes}</Text>
          </View>
        </View>
      </SafeAreaView>
      <View style={styles.container}>
        {loading ? (
          <ActivityIndicator size="large" color="#667eea" style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={profiles}
            keyExtractor={item => String(item.id || item.device_id)}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={<Text style={styles.emptyText}>Aucun profil à afficher.</Text>}
            renderItem={({ item: profile }) => (
              <View style={styles.card}>
                <Text style={styles.name}>{profile.name} {profile.age ? `• ${profile.age} ans` : ''}</Text>
                <Text style={styles.city}>{profile.city}</Text>
                <Text style={styles.bio}>{profile.bio}</Text>
              </View>
            )}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    elevation: 2,
    zIndex: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 56,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#667eea',
    letterSpacing: 1.2,
    textAlign: 'left',
  },
  brumesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 10,
  },
  brumesIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  brumesCount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#667eea',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 22,
    marginBottom: 18,
    shadowColor: '#667eea',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  name: {
    fontSize: 21,
    fontWeight: '700',
    color: '#222',
    marginBottom: 4,
  },
  city: {
    fontSize: 15,
    color: '#667eea',
    marginBottom: 8,
    fontWeight: '600',
  },
  bio: {
    fontSize: 15,
    color: '#444',
  },
  emptyText: {
    textAlign: 'center',
    color: '#aaa',
    marginTop: 40,
    fontSize: 16,
  },
});


