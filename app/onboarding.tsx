import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState, useRef } from 'react';
import HideKeyboardArrow from '../components/HideKeyboardArrow';
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { getDeviceId } from '../lib/device-id';

const { width, height } = Dimensions.get('window');

// Étapes d'inscription
const STEPS = [
  { id: 'welcome', title: 'Bienvenue' },
  { id: 'credentials', title: 'Compte' },
  { id: 'name', title: 'Prénom' },
  { id: 'birthday', title: 'Date de naissance' },
  { id: 'gender', title: 'Genre' },
  { id: 'orientation', title: 'Orientation' },
  { id: 'goal', title: 'Objectif' },
  { id: 'photos', title: 'Photos' },
  { id: 'bio', title: 'Bio' },
  { id: 'interests', title: 'Centres d\'intérêt' },
  { id: 'location', title: 'Localisation' },
  { id: 'complete', title: 'Terminé' },
];

const GENDERS = [
  { id: 'homme', label: 'Homme', emoji: '👨' },
  { id: 'femme', label: 'Femme', emoji: '👩' },
  { id: 'autre', label: 'Autre', emoji: '🧑' },
];

const ORIENTATIONS = [
  { id: 'hetero', label: 'Hétérosexuel(le)', emoji: '💑' },
  { id: 'gay', label: 'Gay / Lesbienne', emoji: '🏳️‍🌈' },
  { id: 'bi', label: 'Bisexuel(le)', emoji: '💜' },
];

const GOALS = [
  { id: 'feeling', label: 'Au feeling', emoji: '🎲', desc: 'On verra bien où ça mène' },
  { id: 'serious', label: 'Relation sérieuse', emoji: '💕', desc: 'Je cherche l\'amour' },
  { id: 'casual', label: 'Sans prise de tête', emoji: '😎', desc: 'Rencontres décontractées' },
];

const INTERESTS_DATA = [
  { id: 'musique', label: 'Musique', emoji: '🎵' },
  { id: 'sport', label: 'Sport', emoji: '⚽' },
  { id: 'voyage', label: 'Voyage', emoji: '✈️' },
  { id: 'cinema', label: 'Cinéma', emoji: '🎬' },
  { id: 'cuisine', label: 'Cuisine', emoji: '🍳' },
  { id: 'lecture', label: 'Lecture', emoji: '📚' },
  { id: 'gaming', label: 'Jeux vidéo', emoji: '🎮' },
  { id: 'art', label: 'Art', emoji: '🎨' },
  { id: 'photo', label: 'Photo', emoji: '📸' },
  { id: 'nature', label: 'Nature', emoji: '🌿' },
  { id: 'animaux', label: 'Animaux', emoji: '🐕' },
  { id: 'mode', label: 'Mode', emoji: '👗' },
  { id: 'tech', label: 'Tech', emoji: '💻' },
  { id: 'fitness', label: 'Fitness', emoji: '💪' },
  { id: 'yoga', label: 'Yoga', emoji: '🧘' },
  { id: 'danse', label: 'Danse', emoji: '💃' },
  { id: 'theatre', label: 'Théâtre', emoji: '🎭' },
  { id: 'vin', label: 'Vin', emoji: '🍷' },
  { id: 'cafe', label: 'Café', emoji: '☕' },
  { id: 'brunch', label: 'Brunch', emoji: '🥐' },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Form data
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [birthDay, setBirthDay] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [gender, setGender] = useState<string | null>(null);
  const [orientation, setOrientation] = useState<string | null>(null);
  const [goal, setGoal] = useState<string | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [bio, setBio] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [city, setCity] = useState('');
  const [locating, setLocating] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const progress = (currentStep / (STEPS.length - 1)) * 100;

  const animateTransition = (callback: () => void) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      callback();
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    });
  };

  const goNext = () => {
    Keyboard.dismiss(); // Fermer le clavier
    if (currentStep < STEPS.length - 1) {
      animateTransition(() => setCurrentStep(prev => prev + 1));
    }
  };

  const goBack = () => {
    Keyboard.dismiss(); // Fermer le clavier
    if (currentStep > 0) {
      animateTransition(() => setCurrentStep(prev => prev - 1));
    } else {
      router.back();
    }
  };

  const calculateAge = () => {
    if (!birthDay || !birthMonth || !birthYear || birthYear.length < 4) return null;
    
    const day = parseInt(birthDay);
    const month = parseInt(birthMonth);
    const year = parseInt(birthYear);
    
    // Validation des valeurs
    if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900 || year > new Date().getFullYear()) {
      return null;
    }
    
    const birth = new Date(year, month - 1, day);
    const today = new Date();
    
    // Vérifier que la date est valide
    if (isNaN(birth.getTime())) return null;
    
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const pickImage = async () => {
    if (photos.length >= 6) {
      Alert.alert('Maximum atteint', 'Tu peux ajouter jusqu\'à 6 photos.');
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusée', 'Autorise l\'accès à tes photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotos(prev => [...prev, result.assets[0].uri]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const toggleInterest = (id: string) => {
    setInterests(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleLocate = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'Active la localisation.');
        setLocating(false);
        return;
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setCoords({ lat: position.coords.latitude, lon: position.coords.longitude });
      const places = await Location.reverseGeocodeAsync({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      const first = places[0];
      setCity(first?.city || first?.region || 'Ville inconnue');
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de récupérer ta position.');
    } finally {
      setLocating(false);
    }
  };

  const handleComplete = async () => {
    try {
      setSubmitting(true);
      
      const deviceId = await getDeviceId();
      const age = calculateAge();
      
      const profileData = {
        device_id: deviceId,
        email: email.trim().toLowerCase(),
        name: name.trim(),
        age,
        gender,
        orientation,
        goal,
        bio: bio.trim(),
        city,
        lat: coords?.lat ?? null,
        lon: coords?.lon ?? null,
        interests,
        photos,
        brumes: 50, // Bonus de bienvenue
        is_online: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Sauvegarder en local
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      await AsyncStorage.setItem('flou_user_profile', JSON.stringify(profileData));
      await AsyncStorage.setItem('flou_onboarding_complete', 'true');
      await AsyncStorage.setItem('flou_user_email', email.trim().toLowerCase());

      // Sauvegarder sur Supabase (sans Auth pour l'instant)
      try {
        const { error } = await supabase
          .from('profiles')
          .upsert(profileData, { onConflict: 'device_id' });

        if (error) {
          console.log('Supabase save error:', error.message);
          // Continue anyway - local data is saved
        } else {
          console.log('Profile saved to Supabase');
        }
      } catch (dbError) {
        console.log('Database error:', dbError);
        // Continue anyway
      }
      
      // Go to main app
      router.replace('/(tabs)');
    } catch (e: any) {
      console.log('Complete error:', e);
      Alert.alert('Erreur', e.message || 'Une erreur est survenue.');
    } finally {
      setSubmitting(false);
    }
  };

  const canProceed = () => {
    switch (STEPS[currentStep].id) {
      case 'welcome': return true;
      case 'credentials': 
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email) && password.length >= 6 && password === confirmPassword;
      case 'name': return name.trim().length >= 2;
      case 'birthday': return birthDay && birthMonth && birthYear && calculateAge()! >= 20;
      case 'gender': return gender !== null;
      case 'orientation': return orientation !== null;
      case 'goal': return goal !== null;
      case 'photos': return photos.length >= 1;
      case 'bio': return true; // Bio is optional
      case 'interests': return interests.length >= 3;
      case 'location': return city.trim().length > 0;
      case 'complete': return true;
      default: return true;
    }
  };

  const renderStep = () => {
    const step = STEPS[currentStep];

    switch (step.id) {
      case 'welcome':
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.welcomeEmoji}>💜</Text>
            <Text style={styles.welcomeTitle}>Bienvenue sur Flou</Text>
            <Text style={styles.welcomeSubtitle}>
              L&apos;application de rencontre où les photos se défloutent progressivement.
              Découvre la personnalité avant le physique !
            </Text>
            <View style={styles.welcomeFeatures}>
              <View style={styles.welcomeFeature}>
                <Text style={styles.featureEmoji}>🔒</Text>
                <Text style={styles.featureText}>Photos floutées au début</Text>
              </View>
              <View style={styles.welcomeFeature}>
                <Text style={styles.featureEmoji}>💬</Text>
                <Text style={styles.featureText}>Défloutage progressif</Text>
              </View>
              <View style={styles.welcomeFeature}>
                <Text style={styles.featureEmoji}>💕</Text>
                <Text style={styles.featureText}>Connexions authentiques</Text>
              </View>
            </View>
          </View>
        );

      case 'credentials':
        const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        const passwordValid = password.length >= 6;
        const passwordsMatch = password === confirmPassword;
        return (
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.stepContainer}>
              <Text style={styles.stepEmoji}>🔐</Text>
              <Text style={styles.stepTitle}>Crée ton compte</Text>
              <Text style={styles.stepSubtitle}>Pour sécuriser tes données</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>📧 Email</Text>
                <HideKeyboardArrow />
                <TextInput
                  style={[styles.credentialInput, email && !emailValid && styles.inputError]}
                  placeholder="ton@email.com"
                  placeholderTextColor="#a0aec0"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {email && !emailValid && (
                  <Text style={styles.errorText}>Email invalide</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>🔑 Mot de passe</Text>
                <View style={styles.passwordContainer}>
                  <HideKeyboardArrow />
                  <TextInput
                    style={[styles.credentialInput, styles.passwordInput, password && !passwordValid && styles.inputError]}
                    placeholder="6 caractères minimum"
                    placeholderTextColor="#a0aec0"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity 
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                  </TouchableOpacity>
                </View>
                {password && !passwordValid && (
                  <Text style={styles.errorText}>6 caractères minimum</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>🔑 Confirme le mot de passe</Text>
                <HideKeyboardArrow />
                <TextInput
                  style={[styles.credentialInput, confirmPassword && !passwordsMatch && styles.inputError]}
                  placeholder="Confirme ton mot de passe"
                  placeholderTextColor="#a0aec0"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                {confirmPassword && !passwordsMatch && (
                  <Text style={styles.errorText}>Les mots de passe ne correspondent pas</Text>
                )}
              </View>
            </View>
          </TouchableWithoutFeedback>
        );

      case 'name':
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepEmoji}>👋</Text>
            <Text style={styles.stepTitle}>Comment tu t&apos;appelles ?</Text>
            <Text style={styles.stepSubtitle}>C&apos;est le prénom qui sera affiché sur ton profil</Text>
            <HideKeyboardArrow />
            <TextInput
              style={styles.bigInput}
              placeholder="Ton prénom"
              placeholderTextColor="#a0aec0"
              value={name}
              onChangeText={setName}
              autoFocus
              maxLength={20}
            />
          </View>
        );

      case 'birthday':
        const age = calculateAge();
        const handleDayChange = (text: string) => {
          const num = text.replace(/[^0-9]/g, '');
          if (num.length <= 2) {
            const val = parseInt(num) || 0;
            if (val > 31) setBirthDay('31');
            else setBirthDay(num);
          }
        };
        const handleMonthChange = (text: string) => {
          const num = text.replace(/[^0-9]/g, '');
          if (num.length <= 2) {
            const val = parseInt(num) || 0;
            if (val > 12) setBirthMonth('12');
            else setBirthMonth(num);
          }
        };
        const handleYearChange = (text: string) => {
          const num = text.replace(/[^0-9]/g, '');
          if (num.length <= 4) {
            setBirthYear(num);
          }
        };
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepEmoji}>🎂</Text>
            <Text style={styles.stepTitle}>Ta date de naissance</Text>
            <Text style={styles.stepSubtitle}>Tu dois avoir au moins 20 ans</Text>
            <HideKeyboardArrow style={{ alignSelf: 'flex-end', marginBottom: 2 }} />
            <View style={styles.dateInputRow}>
              <TextInput
                style={styles.dateInput}
                placeholder="JJ"
                placeholderTextColor="#a0aec0"
                value={birthDay}
                onChangeText={handleDayChange}
                keyboardType="number-pad"
                maxLength={2}
              />
              <TextInput
                style={styles.dateInput}
                placeholder="MM"
                placeholderTextColor="#a0aec0"
                value={birthMonth}
                onChangeText={handleMonthChange}
                keyboardType="number-pad"
                maxLength={2}
              />
              <TextInput
                style={[styles.dateInput, styles.dateInputYear]}
                placeholder="AAAA"
                placeholderTextColor="#a0aec0"
                value={birthYear}
                onChangeText={handleYearChange}
                keyboardType="number-pad"
                maxLength={4}
              />
            </View>
            {birthYear.length === 4 && age !== null && (
              <Text style={[styles.ageText, age < 20 && styles.ageTextError]}>
                {age < 20 ? '❌ Tu dois avoir 20 ans minimum' : `✅ ${age} ans`}
              </Text>
            )}
            {birthYear.length === 4 && age === null && (
              <Text style={styles.ageTextError}>❌ Date invalide</Text>
            )}
          </View>
        );

      case 'gender':
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepEmoji}>🪪</Text>
            <Text style={styles.stepTitle}>Tu es...</Text>
            <View style={styles.optionsContainer}>
              {GENDERS.map((g) => (
                <TouchableOpacity
                  key={g.id}
                  style={[styles.optionCard, gender === g.id && styles.optionCardActive]}
                  onPress={() => setGender(g.id)}
                >
                  <Text style={styles.optionEmoji}>{g.emoji}</Text>
                  <Text style={[styles.optionLabel, gender === g.id && styles.optionLabelActive]}>
                    {g.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 'orientation':
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepEmoji}>💕</Text>
            <Text style={styles.stepTitle}>Tu recherches...</Text>
            <View style={styles.optionsContainer}>
              {ORIENTATIONS.map((o) => (
                <TouchableOpacity
                  key={o.id}
                  style={[styles.optionCard, orientation === o.id && styles.optionCardActive]}
                  onPress={() => setOrientation(o.id)}
                >
                  <Text style={styles.optionEmoji}>{o.emoji}</Text>
                  <Text style={[styles.optionLabel, orientation === o.id && styles.optionLabelActive]}>
                    {o.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 'goal':
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepEmoji}>🎯</Text>
            <Text style={styles.stepTitle}>Ton objectif ?</Text>
            <View style={styles.goalContainer}>
              {GOALS.map((g) => (
                <TouchableOpacity
                  key={g.id}
                  style={[styles.goalCard, goal === g.id && styles.goalCardActive]}
                  onPress={() => setGoal(g.id)}
                >
                  <Text style={styles.goalEmoji}>{g.emoji}</Text>
                  <View style={styles.goalText}>
                    <Text style={[styles.goalLabel, goal === g.id && styles.goalLabelActive]}>
                      {g.label}
                    </Text>
                    <Text style={styles.goalDesc}>{g.desc}</Text>
                  </View>
                  {goal === g.id && <Text style={styles.goalCheck}>✓</Text>}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 'photos':
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepEmoji}>📸</Text>
            <Text style={styles.stepTitle}>Ajoute des photos</Text>
            <Text style={styles.stepSubtitle}>
              Minimum 1 photo • Elles seront floutées au début
            </Text>
            <View style={styles.photosGrid}>
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.photoSlot, index === 0 && styles.photoSlotMain]}
                  onPress={() => photos[index] ? removePhoto(index) : pickImage()}
                >
                  {photos[index] ? (
                    <View style={styles.photoWrapper}>
                      <Image source={{ uri: photos[index] }} style={styles.photoImage} />
                      <BlurView intensity={60} tint="light" style={styles.photoBlur} />
                      <View style={styles.photoRemove}>
                        <Text style={styles.photoRemoveText}>×</Text>
                      </View>
                      {index === 0 && (
                        <View style={styles.mainBadge}>
                          <Text style={styles.mainBadgeText}>PRINCIPALE</Text>
                        </View>
                      )}
                    </View>
                  ) : (
                    <View style={styles.photoAdd}>
                      <Text style={styles.photoAddIcon}>+</Text>
                      {index === 0 && <Text style={styles.photoAddLabel}>Principale</Text>}
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.photoHint}>💡 Tes photos seront floutées jusqu&apos;à ce que tu matches</Text>
          </View>
        );

      case 'bio':
        return (
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.stepContainer}>
              <Text style={styles.stepEmoji}>✍️</Text>
              <Text style={styles.stepTitle}>Parle de toi</Text>
              <Text style={styles.stepSubtitle}>Une bio originale pour te démarquer (optionnel)</Text>
              <TextInput
                style={styles.bioInput}
                placeholder="Ex: L'ananas sur la pizza, c'est oui. 🍕"
                placeholderTextColor="#a0aec0"
                value={bio}
                onChangeText={setBio}
                multiline
                maxLength={300}
                returnKeyType="done"
                blurOnSubmit={true}
                onSubmitEditing={Keyboard.dismiss}
              />
              <Text style={styles.charCount}>{bio.length}/300</Text>
            </View>
          </TouchableWithoutFeedback>
        );

      case 'interests':
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepEmoji}>💝</Text>
            <Text style={styles.stepTitle}>Tes centres d&apos;intérêt</Text>
            <Text style={styles.stepSubtitle}>Choisis au moins 3 passions</Text>
            <ScrollView 
              style={styles.interestsScroll}
              contentContainerStyle={styles.interestsContainer}
              showsVerticalScrollIndicator={false}
            >
              {INTERESTS_DATA.map((interest) => (
                <TouchableOpacity
                  key={interest.id}
                  style={[
                    styles.interestChip,
                    interests.includes(interest.id) && styles.interestChipActive
                  ]}
                  onPress={() => toggleInterest(interest.id)}
                >
                  <Text style={styles.interestEmoji}>{interest.emoji}</Text>
                  <Text style={[
                    styles.interestLabel,
                    interests.includes(interest.id) && styles.interestLabelActive
                  ]}>
                    {interest.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={styles.selectedCount}>
              {interests.length} sélectionné{interests.length > 1 ? 's' : ''}
            </Text>
          </View>
        );

      case 'location':
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepEmoji}>📍</Text>
            <Text style={styles.stepTitle}>Où es-tu ?</Text>
            <Text style={styles.stepSubtitle}>Pour trouver des personnes près de toi</Text>
            
            <TouchableOpacity
              style={styles.locateBtn}
              onPress={handleLocate}
              disabled={locating}
            >
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.locateBtnGradient}
              >
                <Text style={styles.locateBtnIcon}>{locating ? '⏳' : '📍'}</Text>
                <Text style={styles.locateBtnText}>
                  {locating ? 'Localisation...' : 'Me localiser automatiquement'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <Text style={styles.orText}>ou</Text>

            <TextInput
              style={styles.cityInput}
              placeholder="Entre ta ville manuellement"
              placeholderTextColor="#a0aec0"
              value={city}
              onChangeText={setCity}
            />

            {city && (
              <View style={styles.cityConfirm}>
                <Text style={styles.cityConfirmIcon}>✅</Text>
                <Text style={styles.cityConfirmText}>{city}</Text>
              </View>
            )}
          </View>
        );

      case 'complete':
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.completeEmoji}>🎉</Text>
            <Text style={styles.completeTitle}>Profil créé !</Text>
            <Text style={styles.completeSubtitle}>
              Bienvenue {name} ! Tu es prêt(e) à découvrir des personnes incroyables.
            </Text>
            
            <View style={styles.completeSummary}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Prénom</Text>
                <Text style={styles.summaryValue}>{name}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Âge</Text>
                <Text style={styles.summaryValue}>{calculateAge()} ans</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Ville</Text>
                <Text style={styles.summaryValue}>{city}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Photos</Text>
                <Text style={styles.summaryValue}>{photos.length} photo{photos.length > 1 ? 's' : ''}</Text>
              </View>
            </View>

            <View style={styles.bonusBox}>
              <Text style={styles.bonusIcon}>🎁</Text>
              <Text style={styles.bonusText}>+100 Brumes offertes pour bien démarrer !</Text>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <LinearGradient
        colors={['#faf9ff', '#f0eeff', '#ffe9f2']}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea}>
        {/* Header with progress */}
        <View style={styles.header}>
          <TouchableOpacity onPress={goBack} style={styles.backBtn}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {currentStep + 1}/{STEPS.length}
            </Text>
          </View>

          <View style={{ width: 40 }} />
        </View>

        {/* Step content */}
        <KeyboardAvoidingView
          style={styles.content}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Animated.View style={[styles.stepWrapper, { opacity: fadeAnim }]}>
              {renderStep()}
            </Animated.View>
          </ScrollView>
          
          {/* Bottom button - inside KeyboardAvoidingView */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.nextBtn, !canProceed() && styles.nextBtnDisabled]}
              onPress={currentStep === STEPS.length - 1 ? handleComplete : goNext}
              disabled={!canProceed() || submitting}
            >
              <LinearGradient
                colors={canProceed() ? ['#667eea', '#764ba2'] : ['#d1d5db', '#9ca3af']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.nextBtnGradient}
              >
                <Text style={styles.nextBtnText}>
                  {submitting 
                    ? 'Chargement...' 
                    : currentStep === STEPS.length - 1 
                      ? 'Commencer l\'aventure' 
                      : 'Continuer'}
                </Text>
                {currentStep < STEPS.length - 1 && !submitting && (
                  <Text style={styles.nextBtnArrow}>→</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#faf9ff',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  backIcon: {
    fontSize: 28,
    color: '#333',
    marginTop: -2,
  },
  progressContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(102,126,234,0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#667eea',
    borderRadius: 3,
  },
  progressText: {
    marginTop: 6,
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  stepWrapper: {
    flex: 1,
    paddingHorizontal: 24,
  },
  stepContainer: {
    flex: 1,
    paddingTop: 20,
    paddingBottom: 20,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 20 : 16,
    paddingTop: 12,
    backgroundColor: '#faf9ff',
  },
  nextBtn: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  nextBtnDisabled: {
    opacity: 0.7,
  },
  nextBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  nextBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  nextBtnArrow: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },

  // Welcome step
  welcomeEmoji: {
    fontSize: 80,
    textAlign: 'center',
    marginBottom: 20,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  welcomeFeatures: {
    gap: 16,
  },
  welcomeFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    gap: 16,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  featureEmoji: {
    fontSize: 28,
  },
  featureText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },

  // Step common styles
  stepEmoji: {
    fontSize: 60,
    textAlign: 'center',
    marginBottom: 16,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },

  // Credentials inputs
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  credentialInput: {
    backgroundColor: '#fff',
    fontSize: 16,
    color: '#333',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(102,126,234,0.2)',
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  eyeIcon: {
    fontSize: 20,
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
  },

  // Name input
  bigInput: {
    backgroundColor: '#fff',
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    padding: 20,
    borderRadius: 16,
    textAlign: 'center',
    borderWidth: 2,
    borderColor: 'rgba(102,126,234,0.2)',
  },

  // Date inputs
  dateInputRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  dateInput: {
    backgroundColor: '#fff',
    width: 70,
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    padding: 16,
    borderRadius: 16,
    textAlign: 'center',
    borderWidth: 2,
    borderColor: 'rgba(102,126,234,0.2)',
  },
  dateInputYear: {
    width: 100,
  },
  ageText: {
    marginTop: 20,
    fontSize: 16,
    fontWeight: '600',
    color: '#10b981',
    textAlign: 'center',
  },
  ageTextError: {
    color: '#ef4444',
  },

  // Option cards
  optionsContainer: {
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    gap: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionCardActive: {
    borderColor: '#667eea',
    backgroundColor: 'rgba(102,126,234,0.08)',
  },
  optionEmoji: {
    fontSize: 32,
  },
  optionLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  optionLabelActive: {
    color: '#667eea',
  },

  // Goals
  goalContainer: {
    gap: 12,
  },
  goalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 16,
    gap: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  goalCardActive: {
    borderColor: '#667eea',
    backgroundColor: 'rgba(102,126,234,0.08)',
  },
  goalEmoji: {
    fontSize: 36,
  },
  goalText: {
    flex: 1,
  },
  goalLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: '#333',
  },
  goalLabelActive: {
    color: '#667eea',
  },
  goalDesc: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  goalCheck: {
    fontSize: 20,
    color: '#667eea',
    fontWeight: '700',
  },

  // Photos
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  photoSlot: {
    width: (width - 68) / 3,
    height: (width - 68) / 3 * 1.3,
    borderRadius: 12,
    backgroundColor: '#fff',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(102,126,234,0.2)',
    borderStyle: 'dashed',
  },
  photoSlotMain: {
    width: (width - 58) / 2,
    height: (width - 58) / 2 * 1.3,
  },
  photoWrapper: {
    flex: 1,
    position: 'relative',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoBlur: {
    ...StyleSheet.absoluteFillObject,
  },
  photoRemove: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoRemoveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  mainBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    right: 6,
    backgroundColor: '#667eea',
    paddingVertical: 4,
    borderRadius: 8,
    alignItems: 'center',
  },
  mainBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  photoAdd: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoAddIcon: {
    fontSize: 32,
    color: '#667eea',
  },
  photoAddLabel: {
    fontSize: 11,
    color: '#667eea',
    fontWeight: '600',
    marginTop: 4,
  },
  photoHint: {
    marginTop: 20,
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
  },

  // Bio
  bioInput: {
    backgroundColor: '#fff',
    fontSize: 16,
    color: '#333',
    padding: 20,
    borderRadius: 16,
    minHeight: 150,
    textAlignVertical: 'top',
    borderWidth: 2,
    borderColor: 'rgba(102,126,234,0.2)',
  },
  charCount: {
    marginTop: 8,
    fontSize: 13,
    color: '#999',
    textAlign: 'right',
  },

  // Interests
  interestsScroll: {
    maxHeight: 300,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingBottom: 20,
  },
  interestChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  interestChipActive: {
    borderColor: '#667eea',
    backgroundColor: 'rgba(102,126,234,0.1)',
  },
  interestEmoji: {
    fontSize: 18,
  },
  interestLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  interestLabelActive: {
    color: '#667eea',
  },
  selectedCount: {
    marginTop: 16,
    fontSize: 14,
    color: '#667eea',
    fontWeight: '600',
    textAlign: 'center',
  },

  // Location
  locateBtn: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  locateBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  locateBtnIcon: {
    fontSize: 20,
  },
  locateBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  orText: {
    marginVertical: 20,
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  cityInput: {
    backgroundColor: '#fff',
    fontSize: 18,
    color: '#333',
    padding: 18,
    borderRadius: 16,
    textAlign: 'center',
    borderWidth: 2,
    borderColor: 'rgba(102,126,234,0.2)',
  },
  cityConfirm: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 8,
  },
  cityConfirmIcon: {
    fontSize: 20,
  },
  cityConfirmText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#10b981',
  },

  // Complete
  completeEmoji: {
    fontSize: 80,
    textAlign: 'center',
    marginBottom: 16,
  },
  completeTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
  },
  completeSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  completeSummary: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    gap: 12,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 15,
    color: '#666',
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
  },
  bonusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(102,126,234,0.1)',
    padding: 16,
    borderRadius: 16,
    gap: 10,
  },
  bonusIcon: {
    fontSize: 24,
  },
  bonusText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#667eea',
  },
});
