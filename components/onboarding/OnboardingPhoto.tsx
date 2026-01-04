import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';
import { OnboardingData } from '../../hooks/useOnboarding';

interface Props {
  onNext: (data: OnboardingData) => Promise<boolean>;
  onBack: () => void;
  loading: boolean;
  userId: string;
  initialData?: OnboardingData;
}

export function OnboardingPhoto({ onNext, onBack, loading, userId, initialData }: Props) {
  const [photoUri, setPhotoUri] = useState(initialData?.photoUrl || '');
  const [uploading, setUploading] = useState(false);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'Nous avons besoin d\'accéder à vos photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        await uploadPhoto(result.assets[0].uri);
      }
    } catch (err) {
      console.error('Error picking image:', err);
      Alert.alert('Erreur', 'Impossible de sélectionner une photo');
    }
  };

  const uploadPhoto = async (uri: string) => {
    try {
      setUploading(true);

      // Read file
      const response = await fetch(uri);
      const blob = await response.blob();

      // Generate filename
      const filename = `profiles/${userId}/${Date.now()}.jpg`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('profile-photos')
        .upload(filename, blob, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (error) throw error;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('profile-photos').getPublicUrl(filename);

      setPhotoUri(publicUrl);
      Alert.alert('✅ Photo uploadée', 'Vous pouvez voir un aperçu ci-dessous');
    } catch (err) {
      console.error('Upload error:', err);
      Alert.alert('Erreur d\'upload', 'Impossible d\'uploader la photo');
    } finally {
      setUploading(false);
    }
  };

  const handleNext = async () => {
    if (!photoUri) {
      Alert.alert('Erreur', 'Veuillez uploader une photo');
      return;
    }

    const success = await onNext({
      photoUrl: photoUri,
    });

    if (!success) {
      Alert.alert('Erreur', 'Impossible de continuer');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.step}>Étape 6/7</Text>
        <Text style={styles.title}>Ta photo</Text>
        <Text style={styles.subtitle}>Obligatoire et en FLOU pour les autres 🌫️</Text>
      </View>

      {/* Rules */}
      <View style={styles.rulesBox}>
        <Text style={styles.rulesTitle}>📸 Règles de la photo</Text>
        <Text style={styles.ruleItem}>✓ 1 photo minimum</Text>
        <Text style={styles.ruleItem}>✓ Vous verrez net, les autres verront flou</Text>
        <Text style={styles.ruleItem}>✗ Pas de photo de groupe</Text>
        <Text style={styles.ruleItem}>✗ Pas d'avatar ou illustration</Text>
        <Text style={styles.ruleItem}>✗ Photo doit montrer votre visage/corps</Text>
      </View>

      {/* Photo Upload Area */}
      <View style={styles.section}>
        {photoUri ? (
          <View style={styles.photoPreviewContainer}>
            <Text style={styles.previewLabel}>Aperçu de votre photo</Text>

            {/* Net version */}
            <View style={styles.previewRow}>
              <View style={styles.previewColumn}>
                <Text style={styles.previewTitle}>Vous voyez (NET ✨)</Text>
                <Image source={{ uri: photoUri }} style={styles.photoPreview} />
              </View>

              {/* Blur version */}
              <View style={styles.previewColumn}>
                <Text style={styles.previewTitle}>Les autres voient (FLOU 🌫️)</Text>
                <Image
                  source={{ uri: photoUri }}
                  style={[styles.photoPreview, { opacity: 0.3 }]}
                  blurRadius={15}
                />
              </View>
            </View>

            {/* Change button */}
            <TouchableOpacity
              style={[styles.changeButton, (uploading || loading) && styles.buttonDisabled]}
              onPress={pickImage}
              disabled={uploading || loading}
            >
              <Text style={styles.changeButtonText}>🔄 Changer de photo</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.uploadArea, (uploading || loading) && styles.buttonDisabled]}
            onPress={pickImage}
            disabled={uploading || loading}
          >
            {uploading ? (
              <>
                <ActivityIndicator color="#fff" size="large" style={{ marginBottom: 12 }} />
                <Text style={styles.uploadText}>📤 Upload en cours...</Text>
              </>
            ) : (
              <>
                <Text style={styles.uploadIcon}>📸</Text>
                <Text style={styles.uploadText}>Cliquez pour sélectionner une photo</Text>
                <Text style={styles.uploadSubtext}>Format: JPG, PNG | Taille max: 10MB</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Info */}
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>🔒 Confidentialité</Text>
        <Text style={styles.infoText}>
          • Votre photo est stockée de manière sécurisée
        </Text>
        <Text style={styles.infoText}>
          • Elle ne sera jamais partagée avec des tiers
        </Text>
        <Text style={styles.infoText}>
          • Vous pouvez la changer à tout moment
        </Text>
      </View>

      {/* Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.buttonSecondary} onPress={onBack} disabled={loading}>
          <Text style={styles.buttonSecondaryText}>← Retour</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, (!photoUri || loading) && styles.buttonDisabled]}
          onPress={handleNext}
          disabled={!photoUri || loading}
        >
          <Text style={styles.buttonText}>{loading ? '⏳' : 'Suivant →'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  step: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#aaa',
  },
  rulesBox: {
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: '#2196f3',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
  },
  rulesTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2196f3',
    marginBottom: 8,
  },
  ruleItem: {
    fontSize: 12,
    color: '#ddd',
    marginBottom: 4,
  },
  section: {
    marginBottom: 24,
  },
  uploadArea: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(147, 112, 219, 0.5)',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(147, 112, 219, 0.05)',
  },
  uploadIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  uploadText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 6,
  },
  uploadSubtext: {
    fontSize: 12,
    color: '#999',
  },
  photoPreviewContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
  },
  previewLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  previewRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  previewColumn: {
    flex: 1,
  },
  previewTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9370db',
    marginBottom: 8,
  },
  photoPreview: {
    width: '100%',
    height: 160,
    borderRadius: 10,
    backgroundColor: '#222',
  },
  changeButton: {
    backgroundColor: '#9370db',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  changeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  infoBox: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: '#4caf50',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4caf50',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 12,
    color: '#ddd',
    marginBottom: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  buttonSecondary: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  buttonSecondaryText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#aaa',
  },
  button: {
    flex: 1,
    backgroundColor: '#9370db',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});
