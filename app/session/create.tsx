import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
let DateTimePicker: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  DateTimePicker = require('@react-native-community/datetimepicker').default;
} catch (e: any) {
  console.warn('@react-native-community/datetimepicker not available:', e?.message || e);
  DateTimePicker = null;
}

let MapView: any = null;
let Marker: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const maps = require('react-native-maps');
  const { NativeModules } = require('react-native');
  if (!NativeModules || !NativeModules.RNMapsAirModule) {
    console.warn('react-native-maps native module not found; disabling MapView in CreateSession');
    MapView = null;
    Marker = null;
  } else {
    MapView = maps.default || maps.MapView || maps;
    Marker = maps.Marker || maps.MapView?.Marker || maps.default?.Marker;
  }
} catch (e: any) {
  console.warn('react-native-maps not available:', e?.message || e);
  MapView = null;
  Marker = null;
}
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import theme from '@/constants/theme';

interface SessionData {
  title: string;
  description: string;
  date: Date;
  time: Date;
  location: string;
  lat: number;
  lng: number;
  max_participants: number;
  level: string;
  conditions: string;
}

const LEVELS = ['Tous', 'Débutant', 'Intermédiaire', 'Confirmé'];

export default function CreateSessionScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [sessionData, setSessionData] = useState<SessionData>({
    title: '',
    description: '',
    date: new Date(),
    time: new Date(),
    location: '',
    lat: 45.5,
    lng: -73.6,
    max_participants: 10,
    level: 'Tous',
    conditions: 'Excellent',
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const handleCreateSession = async () => {
    if (!sessionData.title.trim() || !sessionData.location.trim()) {
      alert('Veuillez remplir les champs requis');
      return;
    }

    try {
      const { error } = await supabase.from('sessions').insert([
        {
          creator_id: user?.id,
          title: sessionData.title,
          description: sessionData.description,
          scheduled_at: new Date(
            sessionData.date.getFullYear(),
            sessionData.date.getMonth(),
            sessionData.date.getDate(),
            sessionData.time.getHours(),
            sessionData.time.getMinutes()
          ).toISOString(),
          location: sessionData.location,
          lat: sessionData.lat,
          lng: sessionData.lng,
          max_participants: sessionData.max_participants,
          level: sessionData.level,
          conditions: sessionData.conditions,
          participants_count: 1,
        },
      ]);

      if (error) throw error;

      alert('Session créée avec succès !');
      router.back();
    } catch (error) {
      console.error('Error creating session:', error);
      alert('Erreur lors de la création de la session');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Title */}
        <Text style={{ fontSize: 12, fontWeight: '600', color: theme.colors.muted, marginBottom: 6 }}>
          TITRE *
        </Text>
        <TextInput
          style={{
            borderWidth: 1,
            borderColor: theme.colors.border,
            borderRadius: 8,
            padding: 12,
            marginBottom: 16,
            fontSize: 16,
          }}
          placeholder="ex: Session de surf à Hossegor"
          value={sessionData.title}
          onChangeText={(text) => setSessionData({ ...sessionData, title: text })}
        />

        {/* Description */}
        <Text style={{ fontSize: 12, fontWeight: '600', color: theme.colors.muted, marginBottom: 6 }}>
          DESCRIPTION
        </Text>
        <TextInput
          style={{
            borderWidth: 1,
            borderColor: theme.colors.border,
            borderRadius: 8,
            padding: 12,
            marginBottom: 16,
            fontSize: 16,
            minHeight: 80,
            textAlignVertical: 'top',
          }}
          placeholder="Décrivez votre session..."
          value={sessionData.description}
          onChangeText={(text) => setSessionData({ ...sessionData, description: text })}
          multiline
        />

        {/* Date */}
        <Text style={{ fontSize: 12, fontWeight: '600', color: theme.colors.muted, marginBottom: 6 }}>
          DATE *
        </Text>
        <TouchableOpacity
          onPress={() => setShowDatePicker(true)}
            style={{
            borderWidth: 1,
            borderColor: theme.colors.border,
            borderRadius: 8,
            padding: 12,
            marginBottom: 16,
          }}
        >
          <Text style={{ fontSize: 16 }}>
            {sessionData.date.toLocaleDateString('fr-FR')}
          </Text>
        </TouchableOpacity>

        {showDatePicker && DateTimePicker && (
          <DateTimePicker
            value={sessionData.date}
            mode="date"
            display="spinner"
            onChange={(event: any, date?: Date) => {
              if (date) setSessionData({ ...sessionData, date });
              setShowDatePicker(false);
            }}
          />
        )}

        {/* Time */}
        <Text style={{ fontSize: 12, fontWeight: '600', color: theme.colors.muted, marginBottom: 6 }}>
          HEURE *
        </Text>
        <TouchableOpacity
          onPress={() => setShowTimePicker(true)}
            style={{
            borderWidth: 1,
            borderColor: theme.colors.border,
            borderRadius: 8,
            padding: 12,
            marginBottom: 16,
          }}
        >
          <Text style={{ fontSize: 16 }}>
            {sessionData.time.toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </TouchableOpacity>

        {showTimePicker && DateTimePicker && (
          <DateTimePicker
            value={sessionData.time}
            mode="time"
            display="spinner"
            onChange={(event: any, date?: Date) => {
              if (date) setSessionData({ ...sessionData, time: date });
              setShowTimePicker(false);
            }}
          />
        )}

        {/* Location */}
        <Text style={{ fontSize: 12, fontWeight: '600', color: theme.colors.muted, marginBottom: 6 }}>
          LIEU *
        </Text>
        <TextInput
          style={{
            borderWidth: 1,
            borderColor: theme.colors.border,
            borderRadius: 8,
            padding: 12,
            marginBottom: 16,
            fontSize: 16,
          }}
          placeholder="ex: Plage de Hossegor"
          value={sessionData.location}
          onChangeText={(text) => setSessionData({ ...sessionData, location: text })}
        />

        {/* Map Preview */}
        <Text style={{ fontSize: 12, fontWeight: '600', color: '#666', marginBottom: 6 }}>
          POSITION
        </Text>
        <View style={{ height: 200, borderRadius: 8, overflow: 'hidden', marginBottom: 16 }}>
          {MapView ? (
            <MapView
              style={{ flex: 1 }}
              initialRegion={{
                latitude: sessionData.lat,
                longitude: sessionData.lng,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }}
              onPress={(e: any) => {
                const { latitude, longitude } = e.nativeEvent.coordinate;
                setSessionData({
                  ...sessionData,
                  lat: latitude,
                  lng: longitude,
                });
              }}
            >
              <Marker
                coordinate={{ latitude: sessionData.lat, longitude: sessionData.lng }}
                pinColor={theme.colors.primary}
              />
            </MapView>
          ) : (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ color: theme.colors.muted }}>La carte n'est pas disponible dans cet environnement.</Text>
            </View>
          )}
        </View>

        {/* Level */}
        <Text style={{ fontSize: 12, fontWeight: '600', color: theme.colors.muted, marginBottom: 8 }}>
          NIVEAU
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {LEVELS.map((level) => (
            <TouchableOpacity
              key={level}
              onPress={() => setSessionData({ ...sessionData, level })}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: sessionData.level === level ? theme.colors.primary : theme.colors.surface,
              }}
            >
              <Text
                style={{
                  color: sessionData.level === level ? '#FFF' : theme.colors.text,
                  fontWeight: '600',
                }}
              >
                {level}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Max Participants */}
        <Text style={{ fontSize: 12, fontWeight: '600', color: theme.colors.muted, marginBottom: 6 }}>
          PARTICIPANTS MAX
        </Text>
        <TextInput
            style={{
            borderWidth: 1,
            borderColor: theme.colors.border,
            borderRadius: 8,
            padding: 12,
            marginBottom: 16,
            fontSize: 16,
          }}
          placeholder="ex: 10"
          value={sessionData.max_participants.toString()}
          onChangeText={(text) =>
            setSessionData({
              ...sessionData,
              max_participants: parseInt(text) || 1,
            })
          }
          keyboardType="number-pad"
        />

        {/* Conditions */}
        <Text style={{ fontSize: 12, fontWeight: '600', color: theme.colors.muted, marginBottom: 6 }}>
          CONDITIONS
        </Text>
        <TextInput
          style={{
            borderWidth: 1,
            borderColor: theme.colors.border,
            borderRadius: 8,
            padding: 12,
            marginBottom: 24,
            fontSize: 16,
          }}
          placeholder="ex: Vagues 1m50, vent léger"
          value={sessionData.conditions}
          onChangeText={(text) => setSessionData({ ...sessionData, conditions: text })}
        />

        {/* Create Button */}
        <TouchableOpacity
          onPress={handleCreateSession}
          style={{
            backgroundColor: theme.colors.primary,
            paddingVertical: 14,
            borderRadius: 8,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#FFF', fontWeight: '600', fontSize: 16 }}>
            Créer la session
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
