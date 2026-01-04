import React, { useState, useEffect } from 'react';
import theme from '@/constants/theme';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  SafeAreaView,
  ScrollView,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

interface Profile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  age: number;
  bio: string;
  avatar_url?: string;
  level: string;
  city: string;
  lat: number;
  lng: number;
  interests: string[];
  photos: string[];
  created_at: string;
}

const INTERESTS = [
  '🏄 Surf',
  '🤿 Apnée',
  '🚣 Kayak',
  '🏊 Natation',
  '🛟 Sauvetage',
  '🎣 Pêche',
  '⛵ Voile',
  '🛹 Skate',
];

const LEVELS = ['Débutant', 'Intermédiaire', 'Confirmé', 'Professionnel'];

export default function ProfileScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  // Edit state
  const [editedProfile, setEditedProfile] = useState<Partial<Profile>>({});
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  useEffect(() => {
    loadProfile();
  }, [id]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const profileId = id as string;
      const ownProfile = profileId === user?.id;
      setIsOwnProfile(ownProfile);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', profileId)
        .single();

      if (error) throw error;
      setProfile(data);
      setEditedProfile(data);
      setSelectedInterests(data.interests || []);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (imageUri: string) => {
    try {
      const fileName = `${user?.id}-${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, {
          uri: imageUri,
          type: 'image/jpeg',
          name: fileName,
        } as any);

      if (uploadError) throw uploadError;

      const { data: publicUrl } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      setEditedProfile({
        ...editedProfile,
        avatar_url: publicUrl.publicUrl,
      });
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: editedProfile.first_name,
          last_name: editedProfile.last_name,
          age: editedProfile.age,
          bio: editedProfile.bio,
          level: editedProfile.level,
          city: editedProfile.city,
          interests: selectedInterests,
          avatar_url: editedProfile.avatar_url,
        })
        .eq('user_id', user?.id);

      if (error) throw error;

      setProfile(editedProfile as Profile);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Profil introuvable</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Avatar Section */}
        <View style={{ alignItems: 'center', paddingVertical: 20 }}>
          <TouchableOpacity
            onPress={isEditing && isOwnProfile ? pickImage : undefined}
            style={{
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: theme.colors.surface,
              justifyContent: 'center',
              alignItems: 'center',
              overflow: 'hidden',
            }}
          >
            {editedProfile.avatar_url ? (
              <Image
                source={{ uri: editedProfile.avatar_url }}
                style={{ width: '100%', height: '100%' }}
              />
            ) : (
              <Text style={{ fontSize: 40 }}>👤</Text>
            )}
            {isEditing && isOwnProfile && (
              <View
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  backgroundColor: theme.colors.primary,
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text>📷</Text>
              </View>
            )}
          </TouchableOpacity>

          <Text style={{ fontSize: 24, fontWeight: 'bold', marginTop: 12 }}>
            {editedProfile.first_name} {editedProfile.last_name}
          </Text>
          <Text style={{ fontSize: 14, color: theme.colors.muted, marginTop: 4 }}>
            {editedProfile.age} ans • {editedProfile.level}
          </Text>
          <Text style={{ fontSize: 12, color: theme.colors.muted, marginTop: 2 }}>
            📍 {editedProfile.city}
          </Text>
        </View>

        {/* Edit/Done Button */}
        {isOwnProfile && (
          <TouchableOpacity
            onPress={() => {
              if (isEditing) {
                handleSaveProfile();
              } else {
                setIsEditing(true);
              }
            }}
            style={{
              marginHorizontal: 16,
              paddingVertical: 12,
              backgroundColor: isEditing ? theme.colors.primary : theme.colors.primary,
              borderRadius: 8,
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <Text style={{ color: '#FFF', fontWeight: '600', fontSize: 16 }}>
              {isEditing ? '✓ Enregistrer' : '✏️ Modifier'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Bio Section */}
        {isEditing && isOwnProfile ? (
          <View style={{ marginHorizontal: 16, marginBottom: 16 }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: theme.colors.muted, marginBottom: 6 }}>
              BIO
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: theme.colors.border,
                borderRadius: 8,
                padding: 12,
                minHeight: 80,
                fontSize: 16,
                textAlignVertical: 'top',
              }}
              placeholder="Parlez un peu de vous..."
              value={editedProfile.bio || ''}
              onChangeText={(text) => setEditedProfile({ ...editedProfile, bio: text })}
              multiline
            />
          </View>
        ) : (
          <View style={{ marginHorizontal: 16, marginBottom: 16 }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#666', marginBottom: 6 }}>
              À PROPOS
            </Text>
            <Text style={{ fontSize: 14, lineHeight: 20, color: theme.colors.text }}>
              {editedProfile.bio || 'Aucune bio'}
            </Text>
          </View>
        )}

        {/* Level Section */}
        {isEditing && isOwnProfile ? (
          <View style={{ marginHorizontal: 16, marginBottom: 16 }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: theme.colors.muted, marginBottom: 8 }}>
              NIVEAU
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {LEVELS.map((level) => (
                <TouchableOpacity
                  key={level}
                  onPress={() => setEditedProfile({ ...editedProfile, level })}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 20,
                    backgroundColor:
                      editedProfile.level === level ? theme.colors.primary : theme.colors.surface,
                  }}
                >
                  <Text
                    style={{
                      color: editedProfile.level === level ? '#FFF' : theme.colors.text,
                      fontWeight: '600',
                    }}
                  >
                    {level}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          <View style={{ marginHorizontal: 16, marginBottom: 16 }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#666', marginBottom: 8 }}>
              NIVEAU
            </Text>
            <Text
              style={{
                fontSize: 14,
                paddingHorizontal: 12,
                paddingVertical: 6,
                backgroundColor: '#F0F0F0',
                borderRadius: 8,
                overflow: 'hidden',
                alignSelf: 'flex-start',
              }}
            >
              {editedProfile.level}
            </Text>
          </View>
        )}

        {/* Interests Section */}
        {isEditing && isOwnProfile ? (
          <View style={{ marginHorizontal: 16, marginBottom: 16 }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: theme.colors.muted, marginBottom: 8 }}>
              INTÉRÊTS
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {INTERESTS.map((interest) => (
                <TouchableOpacity
                  key={interest}
                  onPress={() => {
                    if (selectedInterests.includes(interest)) {
                      setSelectedInterests(selectedInterests.filter((i) => i !== interest));
                    } else {
                      setSelectedInterests([...selectedInterests, interest]);
                    }
                  }}
                    style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 20,
                    backgroundColor: selectedInterests.includes(interest)
                      ? theme.colors.primary
                      : theme.colors.surface,
                  }}
                >
                  <Text
                    style={{
                      color: selectedInterests.includes(interest) ? '#FFF' : theme.colors.text,
                      fontWeight: '600',
                    }}
                  >
                    {interest}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          <View style={{ marginHorizontal: 16, marginBottom: 16 }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#666', marginBottom: 8 }}>
              INTÉRÊTS
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {selectedInterests.length > 0 ? (
                selectedInterests.map((interest) => (
                  <Text
                      key={interest}
                      style={{
                        fontSize: 13,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        backgroundColor: theme.colors.surface,
                        borderRadius: 8,
                      }}
                    >
                    {interest}
                  </Text>
                ))
              ) : (
                <Text style={{ color: theme.colors.muted }}>Aucun intérêt renseigné</Text>
              )}
            </View>
          </View>
        )}

        {/* Photos Section */}
        <View style={{ marginHorizontal: 16 }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: '#666', marginBottom: 8 }}>
            PHOTOS
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {editedProfile.photos && editedProfile.photos.length > 0 ? (
              editedProfile.photos.map((photo, index) => (
                <Image
                  key={index}
                  source={{ uri: photo }}
                  style={{ width: 100, height: 100, borderRadius: 8 }}
                />
              ))
            ) : (
              <Text style={{ color: '#999' }}>Aucune photo</Text>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
