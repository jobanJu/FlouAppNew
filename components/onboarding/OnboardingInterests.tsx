import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  FlatList,
  Animated,
} from 'react-native';
import { OnboardingData } from '../../hooks/useOnboarding';
import { supabase } from '../../lib/supabase';

interface Interest {
  id: string;
  name: string;
  icon: string;
}

interface Props {
  onNext: (data: OnboardingData) => Promise<boolean>;
  onBack: () => void;
  loading: boolean;
  initialData?: OnboardingData;
}

export function OnboardingInterests({ onNext, onBack, loading, initialData }: Props) {
  const [interests, setInterests] = useState<Interest[]>([]);
  const [selected, setSelected] = useState<Set<string>>(
    new Set(initialData?.interests || [])
  );
  const [interestsLoading, setInterestsLoading] = useState(true);

  useEffect(() => {
    loadInterests();
  }, []);

  const loadInterests = async () => {
    try {
      const { data, error } = await supabase.from('interests').select('id, name, icon');

      if (error) throw error;
      setInterests(data || []);
    } catch (err) {
      console.error('Failed to load interests:', err);
      Alert.alert('Erreur', 'Impossible de charger les intérêts');
    } finally {
      setInterestsLoading(false);
    }
  };

  const toggleInterest = (id: string) => {
    const newSelected = new Set(selected);

    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      // Max 7 interests
      if (newSelected.size >= 7) {
        Alert.alert('Limite atteinte', 'Maximum 7 intérêts');
        return;
      }
      newSelected.add(id);
    }

    setSelected(newSelected);
  };

  const handleNext = async () => {
    if (selected.size < 3) {
      Alert.alert('Erreur', 'Sélectionnez au moins 3 intérêts');
      return;
    }

    const success = await onNext({
      interests: Array.from(selected),
    });

    if (!success) {
      Alert.alert('Erreur', 'Impossible de continuer');
    }
  };

  if (interestsLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.loadingText}>⏳ Chargement des intérêts...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.step}>Étape 4/7</Text>
        <Text style={styles.title}>Tes intérêts</Text>
        <Text style={styles.subtitle}>Le cœur 💜 de FLOU</Text>
        <Text style={styles.counter}>
          {selected.size} / 3-7 sélectionnés
        </Text>
      </View>

      {/* Info */}
      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          🎯 Pas de scoring. Ces intérêts sont visibles par les autres et aident au matching.
        </Text>
      </View>

      {/* Interest Grid */}
      <View style={styles.grid}>
        {interests.map((interest) => (
          <TouchableOpacity
            key={interest.id}
            style={[
              styles.interestCard,
              selected.has(interest.id) && styles.interestCardActive,
            ]}
            onPress={() => toggleInterest(interest.id)}
            disabled={loading}
          >
            <Text style={styles.interestIcon}>{interest.icon}</Text>
            <Text style={styles.interestName}>{interest.name}</Text>

            {selected.has(interest.id) && (
              <View style={styles.checkmark}>
                <Text style={styles.checkmarkText}>✓</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {selected.size > 0 && (
        <View style={styles.selectedBox}>
          <Text style={styles.selectedTitle}>Sélectionnés:</Text>
          <View style={styles.selectedList}>
            {Array.from(selected)
              .map((id) => interests.find((i) => i.id === id))
              .filter(Boolean)
              .map((interest) => (
                <View key={interest?.id} style={styles.selectedTag}>
                  <Text style={styles.selectedTagText}>
                    {interest?.icon} {interest?.name}
                  </Text>
                </View>
              ))}
          </View>
        </View>
      )}

      {/* Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.buttonSecondary} onPress={onBack} disabled={loading}>
          <Text style={styles.buttonSecondaryText}>← Retour</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, (selected.size < 3 || loading) && styles.buttonDisabled]}
          onPress={handleNext}
          disabled={selected.size < 3 || loading}
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
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#aaa',
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
    marginBottom: 6,
  },
  counter: {
    fontSize: 13,
    color: '#9370db',
    fontWeight: '600',
  },
  infoBox: {
    backgroundColor: 'rgba(147, 112, 219, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: '#9370db',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
  },
  infoText: {
    fontSize: 13,
    color: '#ddd',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  interestCard: {
    width: '32%',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  interestCardActive: {
    backgroundColor: 'rgba(147, 112, 219, 0.3)',
    borderColor: '#9370db',
  },
  interestIcon: {
    fontSize: 32,
    marginBottom: 6,
  },
  interestName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  checkmark: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#9370db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  selectedBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(147, 112, 219, 0.3)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
  },
  selectedTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9370db',
    marginBottom: 8,
  },
  selectedList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectedTag: {
    backgroundColor: 'rgba(147, 112, 219, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  selectedTagText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
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
