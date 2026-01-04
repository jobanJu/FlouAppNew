import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { OnboardingData } from '../../hooks/useOnboarding';

interface Props {
  onNext: (data: OnboardingData) => Promise<boolean>;
  onBack: () => void;
  loading: boolean;
  initialData?: OnboardingData;
}

export function OnboardingValues({ onNext, onBack, loading, initialData }: Props) {
  const [valueMatters, setValueMatters] = useState(initialData?.valueMatters || '');
  const [valueSeeking, setValueSeeking] = useState(initialData?.valueSeeking || '');

  const handleNext = async () => {
    if (!valueMatters.trim()) {
      Alert.alert('Erreur', 'Veuillez répondre à la première question');
      return;
    }

    if (!valueSeeking.trim()) {
      Alert.alert('Erreur', 'Veuillez répondre à la deuxième question');
      return;
    }

    if (valueMatters.length > 200) {
      Alert.alert('Erreur', 'Maximum 200 caractères pour la première réponse');
      return;
    }

    if (valueSeeking.length > 200) {
      Alert.alert('Erreur', 'Maximum 200 caractères pour la deuxième réponse');
      return;
    }

    const success = await onNext({
      valueMatters: valueMatters.trim(),
      valueSeeking: valueSeeking.trim(),
    });

    if (!success) {
      Alert.alert('Erreur', 'Impossible de continuer');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.step}>Étape 5/7</Text>
        <Text style={styles.title}>Valeurs & Intentions</Text>
        <Text style={styles.subtitle}>Le cœur du matching 💜</Text>
      </View>

      {/* Info */}
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>🎯 Ces réponses sont plus importantes que les photos</Text>
        <Text style={styles.infoText}>
          Les autres utilisateurs verront ces réponses avant votre photo.
        </Text>
      </View>

      {/* Question 1 */}
      <View style={styles.section}>
        <Text style={styles.question}>
          1. Qu'est-ce qui compte vraiment pour toi? *
        </Text>
        <Text style={styles.note}>
          Ex: L'authenticité, l'ambition, l'humour, la bienveillance...
        </Text>

        <TextInput
          style={styles.textarea}
          placeholder="Ta réponse (max 200 caractères)"
          placeholderTextColor="#666"
          value={valueMatters}
          onChangeText={setValueMatters}
          multiline
          numberOfLines={4}
          editable={!loading}
          maxLength={200}
        />

        <Text style={styles.charCount}>
          {valueMatters.length}/200
        </Text>
      </View>

      {/* Question 2 */}
      <View style={styles.section}>
        <Text style={styles.question}>
          2. Que recherches-tu ici? *
        </Text>
        <Text style={styles.note}>
          Ex: Une relation sérieuse, des amis, une aventure, du calme...
        </Text>

        <TextInput
          style={styles.textarea}
          placeholder="Ta réponse (max 200 caractères)"
          placeholderTextColor="#666"
          value={valueSeeking}
          onChangeText={setValueSeeking}
          multiline
          numberOfLines={4}
          editable={!loading}
          maxLength={200}
        />

        <Text style={styles.charCount}>
          {valueSeeking.length}/200
        </Text>
      </View>

      {/* Tip */}
      <View style={styles.tipBox}>
        <Text style={styles.tipTitle}>💡 Conseil</Text>
        <Text style={styles.tipText}>
          Soyez authentique. Les réponses honnêtes attirent les bonnes personnes.
        </Text>
      </View>

      {/* Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.buttonSecondary} onPress={onBack} disabled={loading}>
          <Text style={styles.buttonSecondaryText}>← Retour</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            (!valueMatters.trim() || !valueSeeking.trim() || loading) && styles.buttonDisabled,
          ]}
          onPress={handleNext}
          disabled={!valueMatters.trim() || !valueSeeking.trim() || loading}
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
  infoBox: {
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: '#ffc107',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffc107',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#ddd',
  },
  section: {
    marginBottom: 24,
  },
  question: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 6,
  },
  note: {
    fontSize: 12,
    color: '#999',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  textarea: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    color: '#fff',
    fontSize: 14,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 11,
    color: '#666',
    marginTop: 6,
    textAlign: 'right',
  },
  tipBox: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: '#4caf50',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
  },
  tipTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4caf50',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 12,
    color: '#ddd',
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
