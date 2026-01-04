import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { OnboardingData } from '../../hooks/useOnboarding';

interface Props {
  onNext: (data: OnboardingData) => Promise<boolean>;
  onBack: () => void;
  loading: boolean;
}

export function OnboardingConsent({ onNext, onBack, loading }: Props) {
  const [consentBlur, setConsentBlur] = useState(false);
  const [consentPhysical, setConsentPhysical] = useState(false);
  const [consentRespect, setConsentRespect] = useState(false);

  const handleNext = async () => {
    if (!consentBlur || !consentPhysical || !consentRespect) {
      Alert.alert('Erreur', 'Veuillez valider tous les consentements');
      return;
    }

    const success = await onNext({
      consentBlur,
      consentPhysical,
      consentRespect,
    });

    if (!success) {
      Alert.alert('Erreur', 'Impossible de finaliser');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.step}>Étape 7/7</Text>
        <Text style={styles.title}>Consentement & Éthique</Text>
        <Text style={styles.subtitle}>Dernière étape avant de commencer 💜</Text>
      </View>

      {/* Warning Box */}
      <View style={styles.warningBox}>
        <Text style={styles.warningTitle}>⚖️ Conditions obligatoires</Text>
        <Text style={styles.warningText}>
          Ces trois validations sont requises pour accéder à FLOU.
        </Text>
      </View>

      {/* Checkbox 1 */}
      <TouchableOpacity
        style={styles.checkboxContainer}
        onPress={() => setConsentBlur(!consentBlur)}
        disabled={loading}
      >
        <View style={[styles.checkbox, consentBlur && styles.checkboxChecked]}>
          {consentBlur && <Text style={styles.checkboxCheck}>✓</Text>}
        </View>

        <View style={styles.checkboxText}>
          <Text style={styles.checkboxLabel}>
            J'accepte la mécanique du flou progressif
          </Text>
          <Text style={styles.checkboxDesc}>
            Je comprends que les photos se débloquent progressivement au fur et à mesure des
            interactions.
          </Text>
        </View>
      </TouchableOpacity>

      {/* Checkbox 2 */}
      <TouchableOpacity
        style={styles.checkboxContainer}
        onPress={() => setConsentPhysical(!consentPhysical)}
        disabled={loading}
      >
        <View style={[styles.checkbox, consentPhysical && styles.checkboxChecked]}>
          {consentPhysical && <Text style={styles.checkboxCheck}>✓</Text>}
        </View>

        <View style={styles.checkboxText}>
          <Text style={styles.checkboxLabel}>
            Le physique n'est pas la priorité ici
          </Text>
          <Text style={styles.checkboxDesc}>
            Je comprends que FLOU favorise les valeurs et les intentions avant le physique.
          </Text>
        </View>
      </TouchableOpacity>

      {/* Checkbox 3 */}
      <TouchableOpacity
        style={styles.checkboxContainer}
        onPress={() => setConsentRespect(!consentRespect)}
        disabled={loading}
      >
        <View style={[styles.checkbox, consentRespect && styles.checkboxChecked]}>
          {consentRespect && <Text style={styles.checkboxCheck}>✓</Text>}
        </View>

        <View style={styles.checkboxText}>
          <Text style={styles.checkboxLabel}>
            Je respecterai tous les utilisateurs
          </Text>
          <Text style={styles.checkboxDesc}>
            Je m'engage à traiter les autres avec respect, honnêteté et bienveillance.
          </Text>
        </View>
      </TouchableOpacity>

      {/* Values */}
      <View style={styles.valuesBox}>
        <Text style={styles.valuesTitle}>💜 Les valeurs de FLOU</Text>

        <View style={styles.valueItem}>
          <Text style={styles.valueIcon}>🧠</Text>
          <View>
            <Text style={styles.valueTitle}>Authenticité d'abord</Text>
            <Text style={styles.valueDesc}>Les profiles basés sur les valeurs, pas sur l'apparence</Text>
          </View>
        </View>

        <View style={styles.valueItem}>
          <Text style={styles.valueIcon}>❤️</Text>
          <View>
            <Text style={styles.valueTitle}>Respect toujours</Text>
            <Text style={styles.valueDesc}>Zéro harcèlement, zéro jugement, zéro discrimination</Text>
          </View>
        </View>

        <View style={styles.valueItem}>
          <Text style={styles.valueIcon}>🌈</Text>
          <View>
            <Text style={styles.valueTitle}>Inclusivité totale</Text>
            <Text style={styles.valueDesc}>Pour tous les genres, orientations, et identités</Text>
          </View>
        </View>

        <View style={styles.valueItem}>
          <Text style={styles.valueIcon}>🛡️</Text>
          <View>
            <Text style={styles.valueTitle}>Sécurité garantie</Text>
            <Text style={styles.valueDesc}>Votre privacy et sécurité sont notre priorité</Text>
          </View>
        </View>
      </View>

      {/* Final Note */}
      <View style={styles.finalBox}>
        <Text style={styles.finalText}>
          ✨ Bienvenue dans FLOU. Préparez-vous à des connexions authentiques et significatives.
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
            (!consentBlur || !consentPhysical || !consentRespect || loading) && styles.buttonDisabled,
          ]}
          onPress={handleNext}
          disabled={!consentBlur || !consentPhysical || !consentRespect || loading}
        >
          <Text style={styles.buttonText}>
            {loading ? '⏳ Finalisation...' : '🚀 Commencer!'}
          </Text>
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
  warningBox: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: '#f44336',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
  },
  warningTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#f44336',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 12,
    color: '#ddd',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'rgba(147, 112, 219, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#9370db',
    borderColor: '#9370db',
  },
  checkboxCheck: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  checkboxText: {
    flex: 1,
  },
  checkboxLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  checkboxDesc: {
    fontSize: 12,
    color: '#999',
    lineHeight: 16,
  },
  valuesBox: {
    backgroundColor: 'rgba(147, 112, 219, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: '#9370db',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  valuesTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#9370db',
    marginBottom: 12,
  },
  valueItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  valueIcon: {
    fontSize: 20,
    marginRight: 10,
    marginTop: 2,
  },
  valueTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  valueDesc: {
    fontSize: 11,
    color: '#aaa',
  },
  finalBox: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: '#4caf50',
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
  },
  finalText: {
    fontSize: 13,
    color: '#ddd',
    fontStyle: 'italic',
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
