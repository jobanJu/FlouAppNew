import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '../lib/supabase';

export interface OnboardingData {
  // Step 1: Identity
  firstName?: string;
  dateOfBirth?: string; // ISO date
  gender?: 'woman' | 'man' | 'non-binary' | 'other' | 'prefer-not-to-say';

  // Step 2: Orientation
  orientation?: 'hetero' | 'gay' | 'bi' | 'pan' | 'other';
  lookingFor?: 'women' | 'men' | 'all';

  // Step 3: Location
  city?: string;
  latitude?: number;
  longitude?: number;
  locationVerified?: boolean;

  // Step 4: Interests
  interests?: string[]; // interest IDs

  // Step 5: Values
  valueMatters?: string;
  valueSeeking?: string;

  // Step 6: Photo
  photoUrl?: string;

  // Step 7: Consent
  consentBlur?: boolean;
  consentPhysical?: boolean;
  consentRespect?: boolean;
}

export function useOnboarding() {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<OnboardingData>({});
  const [completed, setCompleted] = useState(false);

  // Load current onboarding state
  useEffect(() => {
    if (!user) return;

    const loadOnboardingState = async () => {
      try {
        setLoading(true);
        const { data: profile, error: err } = await supabase
          .from('profiles')
          .select(
            `
            onboarding_step,
            onboarding_completed,
            first_name,
            date_of_birth,
            gender,
            orientation,
            looking_for,
            city,
            latitude,
            longitude,
            location_verified,
            value_matters_to_me,
            value_seeking_here,
            photo_url,
            consent_blur_mechanics,
            consent_physical_not_priority,
            consent_respect_others
          `
          )
          .eq('id', user.id)
          .single();

        if (err) throw err;

        if (profile) {
          setStep(profile.onboarding_step || 1);
          setCompleted(profile.onboarding_completed || false);

          const interests = await loadUserInterests(user.id);

          setData({
            firstName: profile.first_name || undefined,
            dateOfBirth: profile.date_of_birth || undefined,
            gender: profile.gender || undefined,
            orientation: profile.orientation || undefined,
            lookingFor: profile.looking_for || undefined,
            city: profile.city || undefined,
            latitude: profile.latitude || undefined,
            longitude: profile.longitude || undefined,
            locationVerified: profile.location_verified || false,
            interests,
            valueMatters: profile.value_matters_to_me || undefined,
            valueSeeking: profile.value_seeking_here || undefined,
            photoUrl: profile.photo_url || undefined,
            consentBlur: profile.consent_blur_mechanics || false,
            consentPhysical: profile.consent_physical_not_priority || false,
            consentRespect: profile.consent_respect_others || false,
          });
        }
      } catch (err) {
        console.error('Failed to load onboarding state:', err);
        setError('Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };

    loadOnboardingState();
  }, [user]);

  const loadUserInterests = async (userId: string): Promise<string[]> => {
    try {
      const { data, error: err } = await supabase
        .from('user_interests')
        .select('interest_id')
        .eq('user_id', userId);

      if (err) throw err;
      return data?.map((d) => d.interest_id) || [];
    } catch (err) {
      console.error('Failed to load interests:', err);
      return [];
    }
  };

  // Validation functions
  const validateStep = (stepNum: number, stepData: OnboardingData): boolean => {
    switch (stepNum) {
      case 1: // Identity
        return !!(
          stepData.firstName &&
          stepData.dateOfBirth &&
          stepData.gender &&
          isAdult(stepData.dateOfBirth)
        );

      case 2: // Orientation
        return !!(stepData.orientation && stepData.lookingFor);

      case 3: // Location
        return !!(stepData.city && stepData.latitude && stepData.longitude && stepData.locationVerified);

      case 4: // Interests
        return !!(stepData.interests && stepData.interests.length >= 3 && stepData.interests.length <= 7);

      case 5: // Values
        return !!(stepData.valueMatters && stepData.valueSeeking);

      case 6: // Photo
        return !!stepData.photoUrl;

      case 7: // Consent
        return !!(stepData.consentBlur && stepData.consentPhysical && stepData.consentRespect);

      default:
        return false;
    }
  };

  const isAdult = (dateOfBirth: string): boolean => {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 18;
  };

  // Save progress for current step
  const saveStep = async (stepData: OnboardingData) => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Validate before saving
      if (!validateStep(step, stepData)) {
        setError(`Étape ${step} incomplète`);
        setLoading(false);
        return false;
      }

      // Update profile
      const updateData: any = {
        onboarding_step: step + 1,
      };

      switch (step) {
        case 1:
          updateData.first_name = stepData.firstName;
          updateData.date_of_birth = stepData.dateOfBirth;
          updateData.gender = stepData.gender;
          break;

        case 2:
          updateData.orientation = stepData.orientation;
          updateData.looking_for = stepData.lookingFor;
          break;

        case 3:
          updateData.city = stepData.city;
          updateData.latitude = stepData.latitude;
          updateData.longitude = stepData.longitude;
          updateData.location_verified = stepData.locationVerified;
          break;

        case 4:
          // Handle interests separately
          await saveInterests(user.id, stepData.interests || []);
          break;

        case 5:
          updateData.value_matters_to_me = stepData.valueMatters;
          updateData.value_seeking_here = stepData.valueSeeking;
          break;

        case 6:
          updateData.photo_url = stepData.photoUrl;
          updateData.photo_blur_progression = 100; // Start fully blurred
          updateData.photo_uploaded_at = new Date().toISOString();
          break;

        case 7:
          updateData.consent_blur_mechanics = stepData.consentBlur;
          updateData.consent_physical_not_priority = stepData.consentPhysical;
          updateData.consent_respect_others = stepData.consentRespect;
          updateData.consent_at = new Date().toISOString();
          break;
      }

      const { error: err } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (err) throw err;

      // Track progress
      await supabase
        .from('onboarding_progress')
        .insert({ user_id: user.id, step })
        .select();

      // Update local state
      setData((prev) => ({ ...prev, ...stepData }));
      setStep((prev) => prev + 1);

      // Check if completed
      if (step === 7) {
        setCompleted(true);
      }

      return true;
    } catch (err) {
      console.error('Failed to save step:', err);
      setError('Erreur de sauvegarde');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const saveInterests = async (userId: string, interestIds: string[]) => {
    try {
      // Delete existing interests
      await supabase.from('user_interests').delete().eq('user_id', userId);

      // Insert new interests
      if (interestIds.length > 0) {
        const inserts = interestIds.map((id) => ({
          user_id: userId,
          interest_id: id,
        }));

        const { error: err } = await supabase.from('user_interests').insert(inserts);
        if (err) throw err;
      }
    } catch (err) {
      console.error('Failed to save interests:', err);
      throw err;
    }
  };

  // Skip to step (admin/testing only)
  const skipToStep = async (targetStep: number) => {
    if (!user) return;
    try {
      await supabase.from('profiles').update({ onboarding_step: targetStep }).eq('id', user.id);
      setStep(targetStep);
    } catch (err) {
      console.error('Failed to skip step:', err);
    }
  };

  // Go back to previous step
  const goBack = () => {
    if (step > 1) {
      setStep((prev) => prev - 1);
    }
  };

  return {
    step,
    loading,
    error,
    data,
    completed,
    saveStep,
    goBack,
    validateStep,
    isAdult,
    skipToStep,
    setData, // For intermediate updates
  };
}
