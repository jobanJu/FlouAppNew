import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { OnboardingData } from '../../hooks/useOnboarding';

interface Props {
  onNext: (data: OnboardingData) => Promise<boolean>;
  onBack: () => void;
  loading: boolean;
  initialData?: OnboardingData;
}

export function OnboardingOrientation({ onNext, onBack, loading, initialData }: Props) {
  const [orientation, setOrientation] = useState<string>(initialData?.orientation || '');
  const [lookingFor, setLookingFor] = useState<string>(initialData?.lookingFor || '');

  const orientations = [
    { value: 'hetero', label: '💑 Hétérosexuel(le)' },
    { value: 'gay', label: '🏳️‍🌈 Gay' },
    { value: 'bi', label: '🏳️‍🌈 Bisexuel(le)' },
    { value: 'pan', label: '🏳️‍⚧️ Pansexuel(le)' },
    { value: 'other', label: '🌈 Autre' },
  ];

  const lookingOptions = [
    { value: 'women', label: '👩 Femmes' },
    { value: 'men', label: '👨 Hommes' },
    { value: 'all', label: '👥 Tous les genres' },
  ];

  const handleNext = async () => {
    if (!orientation) {
      Alert.alert('Erreur', 'Veuillez sélectionner votre orientation');
      return;
    }

    if (!lookingFor) {
      Alert.alert('Erreur', 'Veuillez sélectionner qui vous recherchez');
      return;
    }

    const success = await onNext({
      orientation: orientation as any,
      lookingFor: lookingFor as any,
    });

    if (!success) {
      Alert.alert('Erreur', 'Impossible de continuer');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.step}>Étape 2/7</Text>
        <Text style={styles.title}>Orientation</Text>
        <Text style={styles.subtitle}>Pas de jugement, aucune pression 💜</Text>
      </View>

      {/* Orientation */}
      <View style={styles.section}>
        <Text style={styles.label}>Ton orientation *</Text>
        <Text style={styles.note}>Modifiable plus tard</Text>

        {orientations.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.option, orientation === opt.value && styles.optionActive]}
            onPress={() => setOrientation(opt.value)}
            disabled={loading}
          >
            <View style={styles.optionCircle}>
              {orientation === opt.value && <View style={styles.optionDot} />}
            </View>
            <Text style={styles.optionLabel}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Looking For */}
      <View style={styles.section}>
        <Text style={styles.label}>Tu recherches *</Text>
        <Text style={styles.note}>Modifiable plus tard</Text>

        {lookingOptions.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.option, lookingFor === opt.value && styles.optionActive]}
            onPress={() => setLookingFor(opt.value)}
            disabled={loading}
          >
            <View style={styles.optionCircle}>
              {lookingFor === opt.value && <View style={styles.optionDot} />}
            </View>
            <Text style={styles.optionLabel}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.buttonSecondary} onPress={onBack} disabled={loading}>
          <Text style={styles.buttonSecondaryText}>← Retour</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleNext}
          disabled={loading}
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
  section: {
    marginBottom: 32,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  note: {
    fontSize: 13,
    color: '#999',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  optionActive: {
    backgroundColor: 'rgba(147, 112, 219, 0.3)',
    borderColor: '#9370db',
  },
  optionCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#999',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#9370db',
  },
  optionLabel: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
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
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
