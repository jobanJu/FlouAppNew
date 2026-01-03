import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ActivityIndicator,
  Modal,
} from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';

interface Spot {
  id: string;
  name: string;
  description: string;
  lat: number;
  lng: number;
  difficulty: string;
  best_season: string;
  wave_height: string;
  image_url?: string;
  rating: number;
  reviews_count: number;
}

export default function SpotsScreen() {
  const router = useRouter();
  const [spots, setSpots] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [showMap, setShowMap] = useState(true);
  const [filterDifficulty, setFilterDifficulty] = useState('Tous');

  useEffect(() => {
    loadSpots();
  }, []);

  const loadSpots = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('spots').select('*');

      if (error) throw error;
      setSpots(data || []);
    } catch (error) {
      console.error('Error loading spots:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSpots = spots.filter(
    (spot) => filterDifficulty === 'Tous' || spot.difficulty === filterDifficulty
  );

  const renderSpotCard = ({ item }: { item: Spot }) => (
    <TouchableOpacity
      onPress={() => setSelectedSpot(item)}
      style={{
        backgroundColor: '#F9F9F9',
        marginBottom: 12,
        borderRadius: 8,
        overflow: 'hidden',
      }}
    >
      {item.image_url && (
        <Image
          source={{ uri: item.image_url }}
          style={{ width: '100%', height: 150 }}
        />
      )}
      <View style={{ padding: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 16, fontWeight: '600', flex: 1 }}>
            {item.name}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ color: '#FFD700', marginRight: 4 }}>★</Text>
            <Text style={{ fontWeight: '600' }}>
              {item.rating.toFixed(1)}
            </Text>
            <Text style={{ color: '#999', fontSize: 12, marginLeft: 4 }}>
              ({item.reviews_count})
            </Text>
          </View>
        </View>

        <Text style={{ color: '#666', fontSize: 13, marginTop: 6, lineHeight: 18 }}>
          {item.description}
        </Text>

        <View style={{ flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
          <View style={{ backgroundColor: '#E8F4FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }}>
            <Text style={{ fontSize: 11, color: '#007AFF', fontWeight: '600' }}>
              {item.difficulty}
            </Text>
          </View>
          <View style={{ backgroundColor: '#F0E8FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }}>
            <Text style={{ fontSize: 11, color: '#667BC6', fontWeight: '600' }}>
              {item.wave_height}
            </Text>
          </View>
          <View style={{ backgroundColor: '#E8FFF4', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }}>
            <Text style={{ fontSize: 11, color: '#34C759', fontWeight: '600' }}>
              {item.best_season}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF' }}>
      <View style={{ flex: 1 }}>
        {/* Toggle View */}
        <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 8 }}>
          <TouchableOpacity
            onPress={() => setShowMap(true)}
            style={{
              flex: 1,
              paddingVertical: 8,
              backgroundColor: showMap ? '#007AFF' : '#F0F0F0',
              borderRadius: 6,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: showMap ? '#FFF' : '#333', fontWeight: '600' }}>
              🗺️ Carte
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowMap(false)}
            style={{
              flex: 1,
              paddingVertical: 8,
              backgroundColor: !showMap ? '#007AFF' : '#F0F0F0',
              borderRadius: 6,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: !showMap ? '#FFF' : '#333', fontWeight: '600' }}>
              📋 Liste
            </Text>
          </TouchableOpacity>
        </View>

        {showMap ? (
          <MapView
            style={{ flex: 1 }}
            initialRegion={{
              latitude: 45.5,
              longitude: -73.6,
              latitudeDelta: 10,
              longitudeDelta: 10,
            }}
          >
            {filteredSpots.map((spot) => (
              <Marker
                key={spot.id}
                coordinate={{ latitude: spot.lat, longitude: spot.lng }}
                pinColor={
                  spot.difficulty === 'Facile'
                    ? '#34C759'
                    : spot.difficulty === 'Moyen'
                    ? '#FF9500'
                    : '#FF3B30'
                }
              >
                <Callout
                  onPress={() => setSelectedSpot(spot)}
                >
                  <View style={{ padding: 8 }}>
                    <Text style={{ fontWeight: '600' }}>{spot.name}</Text>
                    <Text style={{ fontSize: 12, color: '#666' }}>
                      {spot.difficulty} • {spot.rating}/5
                    </Text>
                  </View>
                </Callout>
              </Marker>
            ))}
          </MapView>
        ) : (
          <>
            {/* Filter */}
            <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
              <FlatList
                data={['Tous', 'Facile', 'Moyen', 'Difficile']}
                horizontal
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => setFilterDifficulty(item)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 20,
                      backgroundColor: filterDifficulty === item ? '#007AFF' : '#F0F0F0',
                      marginRight: 8,
                    }}
                  >
                    <Text
                      style={{
                        color: filterDifficulty === item ? '#FFF' : '#333',
                        fontWeight: '600',
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

            {/* List */}
            <FlatList
              data={filteredSpots}
              renderItem={renderSpotCard}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
              scrollEnabled
            />
          </>
        )}
      </View>

      {/* Spot Details Modal */}
      <Modal
        visible={!!selectedSpot}
        onRequestClose={() => setSelectedSpot(null)}
        animationType="slide"
      >
        {selectedSpot && (
          <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF' }}>
            <View style={{ padding: 16 }}>
              <TouchableOpacity
                onPress={() => setSelectedSpot(null)}
                style={{ marginBottom: 16 }}
              >
                <Text style={{ fontSize: 18, color: '#007AFF' }}>← Retour</Text>
              </TouchableOpacity>

              {selectedSpot.image_url && (
                <Image
                  source={{ uri: selectedSpot.image_url }}
                  style={{ width: '100%', height: 250, borderRadius: 8, marginBottom: 16 }}
                />
              )}

              <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 8 }}>
                {selectedSpot.name}
              </Text>

              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <Text style={{ color: '#FFD700', marginRight: 4, fontSize: 18 }}>★</Text>
                <Text style={{ fontWeight: '600', marginRight: 8 }}>
                  {selectedSpot.rating.toFixed(1)}/5
                </Text>
                <Text style={{ color: '#999', fontSize: 12 }}>
                  {selectedSpot.reviews_count} avis
                </Text>
              </View>

              <Text style={{ fontSize: 14, color: '#666', lineHeight: 20, marginBottom: 16 }}>
                {selectedSpot.description}
              </Text>

              <View style={{ backgroundColor: '#F9F9F9', padding: 12, borderRadius: 8, marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ color: '#666', fontWeight: '600' }}>Difficulté</Text>
                  <Text>{selectedSpot.difficulty}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ color: '#666', fontWeight: '600' }}>Hauteur des vagues</Text>
                  <Text>{selectedSpot.wave_height}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: '#666', fontWeight: '600' }}>Meilleure saison</Text>
                  <Text>{selectedSpot.best_season}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={{
                  backgroundColor: '#007AFF',
                  paddingVertical: 14,
                  borderRadius: 8,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#FFF', fontWeight: '600', fontSize: 16 }}>
                  Créer une session ici
                </Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        )}
      </Modal>
    </SafeAreaView>
  );
}
