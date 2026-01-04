import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { OnboardingData } from '../../hooks/useOnboarding';

interface Props {
  onNext: (data: OnboardingData) => Promise<boolean>;
  loading: boolean;
  initialData?: OnboardingData;
}

export function OnboardingIdentity({ onNext, loading, initialData }: Props) {
  const [firstName, setFirstName] = useState(initialData?.firstName || '');
  const [dateOfBirth, setDateOfBirth] = useState(
    initialData?.dateOfBirth ? new Date(initialData.dateOfBirth) : new Date(2000, 0, 1)
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [gender, setGender] = useState<string>(initialData?.gender || '');

  const genderOptions = [
    { value: 'woman', label: '👩 Femme' },
    { value: 'man', label: '👨 Homme' },
    { value: 'non-binary', label: '⚪ Non-binaire' },
    { value: 'other', label: '🌈 Autre' },
    { value: 'prefer-not-to-say', label: '🤐 Préfère ne pas dire' },
  ];

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setDateOfBirth(selectedDate);
    }
  };

  const calculateAge = (date: Date): number => {
    const today = new Date();
    let age = today.getFullYear() - date.getFullYear();
    const monthDiff = today.getMonth() - date.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
      age--;
    }
    return age;
  };

  const handleNext = async () => {
    if (!firstName.trim()) {
      Alert.alert('Erreur', 'Le prénom est requis');
      return;
    }

    const age = calculateAge(dateOfBirth);
    if (age < 18) {
      Alert.alert('Erreur', 'Vous devez être âgé(e) de 18 ans minimum');
      return;
    }

    if (!gender) {
      Alert.alert('Erreur', 'Veuillez sélectionner un genre');
      return;
    }

    const success = await onNext({
      firstName: firstName.trim(),
      dateOfBirth: dateOfBirth.toISOString().split('T')[0],
      gender: gender as any,
    });

    if (!success) {
      Alert.alert('Erreur', 'Impossible de continuer');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.step}>Étape 1/7</Text>
        <Text style={styles.title}>Ton identité</Text>
        <Text style={styles.subtitle}>Commençons par les bases</Text>
      </View>

      {/* First Name */}
      <View style={styles.section}>
        <Text style={styles.label}>Prénom *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Sarah"
          value={firstName}
          onChangeText={setFirstName}
          placeholderTextColor="#999"
          editable={!loading}
        />
      </View>

      {/* Date of Birth */}
      <View style={styles.section}>
        <Text style={styles.label}>Date de naissance *</Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
          disabled={loading}
        >
          <Text style={styles.dateText}>{dateOfBirth.toLocaleDateString('fr-FR')}</Text>
          <Text style={styles.ageText}>({calculateAge(dateOfBirth)} ans)</Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={dateOfBirth}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
            maximumDate={new Date(new Date().setFullYear(new Date().getFullYear() - 18))}
          />
        )}
      </View>

      {/* Gender */}
      <View style={styles.section}>
        <Text style={styles.label}>Genre *</Text>
        <Text style={styles.note}>⚠️ Utilisé uniquement pour l'UX, jamais pour discriminer</Text>

        <View style={styles.genderGrid}>
          {genderOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[styles.genderButton, gender === option.value && styles.genderButtonActive]}
              onPress={() => setGender(option.value)}
              disabled={loading}
            >
              <Text style={styles.genderLabel}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Next Button */}
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleNext}
        disabled={loading}
      >
        <Text style={styles.buttonText}>{loading ? '⏳ Chargement...' : 'Suivant →'}</Text>
      </TouchableOpacity>
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
    marginBottom: 12,
  },
  note: {
    fontSize: 13,
    color: '#ff9800',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#fff',
  },
  dateButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  ageText: {
    fontSize: 12,
    color: '#aaa',
    fontStyle: 'italic',
  },
  genderGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  genderButton: {
    flex: 1,
    minWidth: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  genderButtonActive: {
    backgroundColor: 'rgba(147, 112, 219, 0.3)',
    borderColor: '#9370db',
  },
  genderLabel: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#9370db',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
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
