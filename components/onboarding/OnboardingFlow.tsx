import React, { useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOnboarding } from '../../hooks/useOnboarding';
import { OnboardingIdentity } from './OnboardingIdentity';
import { OnboardingOrientation } from './OnboardingOrientation';
import { OnboardingLocation } from './OnboardingLocation';
import { OnboardingInterests } from './OnboardingInterests';
import { OnboardingValues } from './OnboardingValues';
import { OnboardingPhoto } from './OnboardingPhoto';
import { OnboardingConsent } from './OnboardingConsent';
import { useAuth } from '../../hooks/useAuth';

interface Props {
  onComplete?: () => void;
}

export function OnboardingFlow({ onComplete }: Props) {
  const { user } = useAuth();
  const { step, loading, error, data, completed, saveStep, goBack, setData } = useOnboarding();

  // If onboarding is completed, show message
  if (completed) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.successIcon}>🎉</Text>
          <Text style={styles.successTitle}>Bienvenue sur FLOU!</Text>
          <Text style={styles.successText}>
            Votre profil est maintenant complet. Vous pouvez commencer à swiper!
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>Erreur d'authentification</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleNext = async (stepData: any): Promise<boolean> => {
    // Update local data
    setData((prev) => ({ ...prev, ...stepData }));
    // Save to Supabase and normalize return to boolean
    const result = await saveStep({ ...data, ...stepData });
    return !!result;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${(step / 7) * 100}%`,
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>{step}/7</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {step === 1 && (
          <OnboardingIdentity onNext={handleNext} loading={loading} initialData={data} />
        )}

        {step === 2 && (
          <OnboardingOrientation
            onNext={handleNext}
            onBack={goBack}
            loading={loading}
            initialData={data}
          />
        )}

        {step === 3 && (
          <OnboardingLocation
            onNext={handleNext}
            onBack={goBack}
            loading={loading}
            initialData={data}
          />
        )}

        {step === 4 && (
          <OnboardingInterests
            onNext={handleNext}
            onBack={goBack}
            loading={loading}
            initialData={data}
          />
        )}

        {step === 5 && (
          <OnboardingValues
            onNext={handleNext}
            onBack={goBack}
            loading={loading}
            initialData={data}
          />
        )}

        {step === 6 && (
          <OnboardingPhoto
            onNext={handleNext}
            onBack={goBack}
            loading={loading}
            userId={user.id}
            initialData={data}
          />
        )}

        {step === 7 && (
          <OnboardingConsent onNext={handleNext} onBack={goBack} loading={loading} />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#9370db',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  successIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  successText: {
    fontSize: 15,
    color: '#aaa',
    textAlign: 'center',
    lineHeight: 22,
  },
  errorText: {
    fontSize: 16,
    color: '#ff6b6b',
    textAlign: 'center',
  },
});
