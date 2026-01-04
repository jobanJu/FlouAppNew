import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import { OnboardingData } from '../../hooks/useOnboarding';

interface Props {
  onNext: (data: OnboardingData) => Promise<boolean>;
  onBack: () => void;
  loading: boolean;
  initialData?: OnboardingData;
}

export function OnboardingLocation({ onNext, onBack, loading, initialData }: Props) {
  const [city, setCity] = useState(initialData?.city || '');
  const [latitude, setLatitude] = useState(initialData?.latitude || 0);
  const [longitude, setLongitude] = useState(initialData?.longitude || 0);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const requestLocation = async () => {
    try {
      setLocationLoading(true);
      setLocationError(null);

      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        setLocationError('Permission refusée');
        Alert.alert('Permission GPS', 'La localisation est requise pour continuer');
        setLocationLoading(false);
        return;
      }

      // Get current position
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude: lat, longitude: lng } = location.coords;
      setLatitude(lat);
      setLongitude(lng);

      // Reverse geocode to get city
      const reverseGeocoded = await Location.reverseGeocodeAsync({
        latitude: lat,
        longitude: lng,
      });

      if (reverseGeocoded.length > 0) {
        const cityName = reverseGeocoded[0].city || reverseGeocoded[0].region || 'Localisation détectée';
        setCity(cityName);
      }

      Alert.alert(
        '✅ Localisation détectée',
        `Ville: ${reverseGeocoded[0]?.city || 'Inconnue'}\nDistance: visible par les autres utilisateurs`
      );
    } catch (err: any) {
      console.error('Location error:', err);
      setLocationError(err.message || 'Erreur de localisation');
      Alert.alert('Erreur', 'Impossible de détecter votre localisation');
    } finally {
      setLocationLoading(false);
    }
  };

  const handleNext = async () => {
    if (!city) {
      Alert.alert('Erreur', 'Veuillez d\'abord détecter votre localisation');
      return;
    }

    const success = await onNext({
      city,
      latitude,
      longitude,
      locationVerified: true,
    });

    if (!success) {
      Alert.alert('Erreur', 'Impossible de continuer');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.step}>Étape 3/7</Text>
        <Text style={styles.title}>Localisation</Text>
        <Text style={styles.subtitle}>Obligatoire pour le matching</Text>
      </View>

      {/* Warning */}
      <View style={styles.warningBox}>
        <Text style={styles.warningTitle}>🔒 Confidentialité</Text>
        <Text style={styles.warningText}>
          Votre position précise n'est JAMAIS affichée. Les autres voient seulement:
        </Text>
        <Text style={styles.warningList}>• Votre ville</Text>
        <Text style={styles.warningList}>• Distance approximative (ex: "à 3 km")</Text>
      </View>

      {/* Current Location Status */}
      {city && (
        <View style={styles.successBox}>
          <Text style={styles.successTitle}>✅ Localisation détectée</Text>
          <Text style={styles.successText}>
            Ville: <Text style={styles.cityBold}>{city}</Text>
          </Text>
          <Text style={styles.coordsText}>
            ({latitude.toFixed(2)}°, {longitude.toFixed(2)}°)
          </Text>
        </View>
      )}

      {locationError && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>⚠️ {locationError}</Text>
        </View>
      )}

      {/* Location Request Button */}
      <View style={styles.section}>
        <Text style={styles.label}>Détecter ma localisation *</Text>
        <Text style={styles.note}>
          Cliquez sur le bouton ci-dessous. Une demande de permission GPS apparaîtra.
        </Text>

        <TouchableOpacity
          style={[styles.locationButton, (loading || locationLoading) && styles.buttonDisabled]}
          onPress={requestLocation}
          disabled={loading || locationLoading}
        >
          {locationLoading ? (
            <>
              <ActivityIndicator color="#fff" size="small" style={{ marginRight: 8 }} />
              <Text style={styles.buttonText}>🔍 Détection en cours...</Text>
            </>
          ) : (
            <Text style={styles.buttonText}>📍 Détecter mon GPS</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Why GPS Required */}
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>Pourquoi la localisation est requise?</Text>
        <Text style={styles.infoText}>
          • Vérifier que tu es un humain (pas de VPN/spoofing)
        </Text>
        <Text style={styles.infoText}>
          • Montrer les gens près de toi
        </Text>
        <Text style={styles.infoText}>
          • Bloquer les bots et faux profils
        </Text>
      </View>

      {/* Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.buttonSecondary} onPress={onBack} disabled={loading}>
          <Text style={styles.buttonSecondaryText}>← Retour</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, (!city || loading) && styles.buttonDisabled]}
          onPress={handleNext}
          disabled={!city || loading}
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
    marginBottom: 40,
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
  warningBox: {
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: '#ff9800',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ff9800',
    marginBottom: 6,
  },
  warningText: {
    fontSize: 13,
    color: '#ddd',
    marginBottom: 6,
  },
  warningList: {
    fontSize: 12,
    color: '#bbb',
    marginLeft: 4,
    marginBottom: 3,
  },
  successBox: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: '#4caf50',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4caf50',
    marginBottom: 6,
  },
  successText: {
    fontSize: 13,
    color: '#ddd',
  },
  cityBold: {
    fontWeight: '700',
    color: '#fff',
  },
  coordsText: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
    fontStyle: 'italic',
  },
  errorBox: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: '#f44336',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  errorText: {
    fontSize: 13,
    color: '#ff6b6b',
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  note: {
    fontSize: 12,
    color: '#999',
    marginBottom: 12,
  },
  locationButton: {
    backgroundColor: '#2196f3',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  infoBox: {
    backgroundColor: 'rgba(33, 150, 243, 0.05)',
    borderLeftWidth: 3,
    borderLeftColor: '#2196f3',
    borderRadius: 8,
    padding: 12,
    marginBottom: 32,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2196f3',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#bbb',
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
