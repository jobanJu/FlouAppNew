import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { BlurView } from 'expo-blur';
import React, { useEffect, useState } from 'react';
import HideKeyboardArrow from '../../components/HideKeyboardArrow';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Dimensions,
  Image,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../lib/supabase';
import { getDeviceId } from '../../lib/device-id';

const { width } = Dimensions.get('window');

const ORIENTATIONS = ['Gay/Lesbienne', 'Bisexuel', 'Heterosexuel'];
const GOALS = ['Au feeling', 'Priorité au sérieux', 'One Life'];
const PASTS = ['En bon termes', 'Désastreuse', 'En tout tranquilité'];

const INTERESTS = [
  'Lecture', 'Cinema', 'Musique', 'Concert', 'Randonné', 'Sport en salle', 'Sport Collectif', 'Sport de Combat', 'Sport de Nature', 'Cuisine', 'Photographie', 'Dessin', 'Peinture', 'Velo', 'Science', 'Ecriture', 'Bricolage', 'Jardinage', 'Animaux', 'Shopping', 'Mode', 'Technologie', 'Alcool', 'Terroire', 'Spectacle', 'Musée', 'Voyage', 'Jeux de societé', 'Peche', 'Chasse', 'Collection', 'Voiture', 'Investissement', 'Bar', 'Restaurant', 'Bande dessinée', 'Poésie', 'Couture', 'Tricot', 'Collection de disques', 'Sport', 'Arts martiaux', 'Escalade', 'Cyclisme', 'Camping', 'Survie', 'Science-fiction', 'Fantastique', 'Horreur', 'Documentaires', 'Biographies', 'Philosophie', 'Mythologie', 'Paléontologie', 'Généalogie', 'Web design', 'Programmation', 'Robotique', 'Intelligence artificielle', 'Électronique', 'Domotique',
];

const MAX_PHOTOS = 6;

export default function EditProfileScreen() {
  const router = useRouter();
  const [name, setName] = useState('Sarah');
  const [age, setAge] = useState('24');
  const [tag, setTag] = useState('ARTISTE');
  const [bio, setBio] = useState("L'ananas sur la pizza, c'est oui.");

  const [orientation, setOrientation] = useState<string | null>('Heterosexuel');
  const [goal, setGoal] = useState<string | null>('Au feeling');
  const [past, setPast] = useState<string | null>('En bon termes');
  const [selectedInterests, setSelectedInterests] = useState<string[]>(['Musique', 'Voyage']);
  const [emojis, setEmojis] = useState('🤘😎✨');
  const [hasKids, setHasKids] = useState<string | null>('Non');
  const [livesAlone, setLivesAlone] = useState<string | null>('Oui');
  const [city, setCity] = useState('Paris');
  const [shareLocation, setShareLocation] = useState<string | null>('Non');
  const [locating, setLocating] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Photos state
  const [photos, setPhotos] = useState<string[]>([]);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [blurIntensity, setBlurIntensity] = useState(80);
  
  // Vocal de présentation
  const [hasVocalPremium, setHasVocalPremium] = useState(false);
  const [vocalRecorded, setVocalRecorded] = useState(false);
  const [isRecordingVocal, setIsRecordingVocal] = useState(false);
  const [vocalDuration, setVocalDuration] = useState(0);

  const toggleInterest = (item: string) => {
    setSelectedInterests((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const deviceId = await getDeviceId();
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('device_id', deviceId)
          .maybeSingle();
        if (error) {
          console.log('Profile fetch skipped:', error.message);
          return;
        }
        if (!data) return;
        setName(data.name || name);
        setAge(data.age ? String(data.age) : age);
        setTag(data.tag || tag);
        setBio(data.bio || bio);
        setOrientation(data.orientation || orientation);
        setGoal(data.goal || goal);
        setPast(data.past || past);
        setHasKids(data.has_kids || hasKids);
        setLivesAlone(data.lives_alone || livesAlone);
        setCity(data.city || city);
        setShareLocation(data.share_location || shareLocation);
        if (Array.isArray(data.interests)) setSelectedInterests(data.interests);
        setEmojis(data.emojis || emojis);
        if (data.lat && data.lon) setCoords({ lat: data.lat, lon: data.lon });
        if (Array.isArray(data.photos)) setPhotos(data.photos);
      } catch (e) {
        console.log('Profile fetch error');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    try {
      setLoading(true);
      const deviceId = await getDeviceId();
      const { error } = await supabase
        .from('profiles')
        .upsert({
          device_id: deviceId,
          name,
          age: age ? Number(age) : null,
          tag,
          bio,
          orientation,
          goal,
          has_kids: hasKids,
          lives_alone: livesAlone,
          city,
          share_location: shareLocation,
          lat: coords?.lat ?? null,
          lon: coords?.lon ?? null,
          past,
          interests: selectedInterests,
          emojis,
          photos,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'device_id' });
      if (error) throw error;
      Alert.alert('Profil enregistré', 'Modifications sauvegardées.');
      router.back();
    } catch (e: any) {
      Alert.alert('Erreur', e.message || 'Sauvegarde impossible.');
    } finally {
      setLoading(false);
    }
  };

  const handleLocate = async () => {
    setShareLocation('Oui');
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'Active la localisation pour remplir la ville.');
        setLocating(false);
        return;
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setCoords({ lat: position.coords.latitude, lon: position.coords.longitude });
      const places = await Location.reverseGeocodeAsync({ latitude: position.coords.latitude, longitude: position.coords.longitude });
      const first = places[0];
      const cityName = first?.city || first?.region || 'Inconnu';
      setCity(cityName);
    } catch (e) {
      Alert.alert('Erreur localisation', 'Impossible de récupérer ta position pour le moment.');
    } finally {
      setLocating(false);
    }
  };

  const pickImage = async () => {
    if (photos.length >= MAX_PHOTOS) {
      Alert.alert('Maximum atteint', `Tu peux ajouter jusqu'à ${MAX_PHOTOS} photos.`);
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusée', 'Autorise l\'accès à tes photos pour continuer.');
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

  const takePhoto = async () => {
    if (photos.length >= MAX_PHOTOS) {
      Alert.alert('Maximum atteint', `Tu peux ajouter jusqu'à ${MAX_PHOTOS} photos.`);
      return;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusée', 'Autorise l\'accès à la caméra pour continuer.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotos(prev => [...prev, result.assets[0].uri]);
    }
  };

  const removePhoto = (index: number) => {
    Alert.alert(
      'Supprimer la photo',
      'Es-tu sûr de vouloir supprimer cette photo ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive',
          onPress: () => setPhotos(prev => prev.filter((_, i) => i !== index))
        }
      ]
    );
  };

  const setAsMainPhoto = (index: number) => {
    if (index === 0) return;
    setPhotos(prev => {
      const newPhotos = [...prev];
      const [photo] = newPhotos.splice(index, 1);
      newPhotos.unshift(photo);
      return newPhotos;
    });
  };

  const showPhotoOptions = () => {
    Alert.alert(
      'Ajouter une photo',
      'Ta photo sera automatiquement floutée pour les autres utilisateurs',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: '📷 Prendre une photo', onPress: takePhoto },
        { text: '🖼️ Galerie', onPress: pickImage },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Éditer mon profil</Text>
          <TouchableOpacity onPress={handleSave} style={styles.saveHeaderBtn}>
            <Text style={styles.saveHeaderText}>{loading ? '...' : 'OK'}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent} 
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Photos Section */}
          <View style={styles.formCard}>
            <View style={styles.photosSectionHeader}>
              <Text style={styles.cardTitle}>📸 Mes photos</Text>
              <View style={styles.blurBadge}>
                <Text style={styles.blurBadgeText}>🌫️ Floutées</Text>
              </View>
            </View>
            
            <Text style={styles.photosSubtitle}>
              Tes photos sont floutées par défaut. Les autres ne les verront clairement qu&apos;après un match !
            </Text>

            {/* Photos Grid */}
            <View style={styles.photosGrid}>
              {/* Main Photo */}
              <TouchableOpacity 
                style={styles.mainPhotoContainer}
                onPress={() => photos[0] ? setPreviewPhoto(photos[0]) : showPhotoOptions()}
                onLongPress={() => photos[0] && removePhoto(0)}
              >
                {photos[0] ? (
                  <View style={styles.photoWrapper}>
                    <Image source={{ uri: photos[0] }} style={styles.mainPhoto} />
                    <BlurView intensity={blurIntensity} tint="default" style={styles.photoBlur} />
                    <View style={styles.mainBadge}>
                      <Text style={styles.mainBadgeText}>PRINCIPALE</Text>
                    </View>
                    <TouchableOpacity 
                      style={styles.removePhotoBtn}
                      onPress={() => removePhoto(0)}
                    >
                      <Text style={styles.removePhotoText}>×</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.addMainPhoto}>
                    <Text style={styles.addPhotoIcon}>📷</Text>
                    <Text style={styles.addPhotoText}>Photo principale</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Secondary Photos Grid */}
              <View style={styles.secondaryPhotosContainer}>
                {[1, 2, 3, 4, 5].map((index) => (
                  <TouchableOpacity 
                    key={index}
                    style={styles.secondaryPhotoContainer}
                    onPress={() => photos[index] ? setPreviewPhoto(photos[index]) : showPhotoOptions()}
                    onLongPress={() => photos[index] && removePhoto(index)}
                  >
                    {photos[index] ? (
                      <View style={styles.photoWrapper}>
                        <Image source={{ uri: photos[index] }} style={styles.secondaryPhoto} />
                        <BlurView intensity={blurIntensity} tint="default" style={styles.photoBlur} />
                        <TouchableOpacity 
                          style={styles.removePhotoSmallBtn}
                          onPress={() => removePhoto(index)}
                        >
                          <Text style={styles.removePhotoSmallText}>×</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.starBtn}
                          onPress={() => setAsMainPhoto(index)}
                        >
                          <Text style={styles.starText}>⭐</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={styles.addSecondaryPhoto}>
                        <Text style={styles.addSecondaryIcon}>+</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Blur Intensity Slider Info */}
            <View style={styles.blurInfoContainer}>
              <Text style={styles.blurInfoIcon}>💡</Text>
              <Text style={styles.blurInfoText}>
                Maintiens appuyé pour supprimer, appuie sur ⭐ pour définir comme principale
              </Text>
            </View>
          </View>

          {/* Preview Card */}
          <View style={styles.previewCard}>
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.previewGradient}
            />
            <View style={styles.previewContent}>
              <View style={styles.previewAvatarContainer}>
                {photos[0] ? (
                  <View style={styles.previewAvatarWrapper}>
                    <Image source={{ uri: photos[0] }} style={styles.previewAvatarImage} />
                    <BlurView intensity={60} tint="default" style={styles.previewAvatarBlur} />
                  </View>
                ) : (
                  <View style={styles.previewAvatar}>
                    <Text style={styles.previewAvatarText}>{name?.[0]?.toUpperCase() || '?'}</Text>
                  </View>
                )}
              </View>
              <View style={styles.previewInfo}>
                <View style={styles.previewNameRow}>
                  <Text style={styles.previewName}>{name || 'Mon prénom'}</Text>
                  <Text style={styles.previewAge}>, {age || '??'}</Text>
                </View>
                <Text style={styles.previewCity}>📍 {city || 'Ville inconnue'}</Text>
                <View style={styles.previewBadges}>
                  {tag ? (
                    <View style={styles.previewTag}>
                      <Text style={styles.previewTagText}>{tag}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </View>
            <Text style={styles.previewBio}>{bio || 'Ajoute une bio pour te décrire.'}</Text>
            {emojis ? <Text style={styles.previewEmojis}>{emojis}</Text> : null}
          </View>

          {/* Basic Info */}
          <View style={styles.formCard}>
            <Text style={styles.cardTitle}>Informations de base</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Prénom</Text>
              <HideKeyboardArrow />
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Ton prénom"
                placeholderTextColor="#a0aec0"
                style={styles.input}
              />
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Âge</Text>
                <HideKeyboardArrow />
                <TextInput
                  value={age}
                  onChangeText={setAge}
                  placeholder="Âge"
                  placeholderTextColor="#a0aec0"
                  keyboardType="numeric"
                  style={styles.input}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 2, marginLeft: 12 }]}>
                <Text style={styles.label}>Tag</Text>
                <HideKeyboardArrow />
                <TextInput
                  value={tag}
                  onChangeText={setTag}
                  placeholder="Ex: ARTISTE"
                  placeholderTextColor="#a0aec0"
                  style={styles.input}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Bio</Text>
              <HideKeyboardArrow />
              <TextInput
                value={bio}
                onChangeText={setBio}
                placeholder="Ta bio"
                placeholderTextColor="#a0aec0"
                style={[styles.input, styles.textArea]}
                multiline
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Décris-toi en 3 emoji</Text>
              <HideKeyboardArrow />
              <TextInput
                value={emojis}
                onChangeText={setEmojis}
                placeholder="Ex: 🤘😎✨"
                placeholderTextColor="#a0aec0"
                style={styles.input}
                maxLength={12}
              />
            </View>
          </View>

          {/* Vocal de Présentation */}
          <View style={styles.formCard}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.cardTitle}>🎙️ Vocal de Présentation</Text>
              {!hasVocalPremium && (
                <View style={styles.premiumBadge}>
                  <Text style={styles.premiumBadgeText}>300 ☁️</Text>
                </View>
              )}
            </View>
            
            <Text style={styles.vocalDescription}>
              {hasVocalPremium 
                ? 'Enregistre un vocal de 5 secondes pour te présenter aux autres utilisateurs.'
                : 'Débloque cette fonctionnalité pour ajouter un vocal de 5 secondes à ton profil. Les abonnés Cupidon ont un vocal de 10 secondes !'}
            </Text>

            {hasVocalPremium ? (
              <View style={styles.vocalRecordContainer}>
                {vocalRecorded ? (
                  <View style={styles.vocalRecordedBox}>
                    <View style={styles.vocalPlayBtn}>
                      <Text style={styles.vocalPlayIcon}>▶️</Text>
                    </View>
                    <View style={styles.vocalWaveform}>
                      {[...Array(12)].map((_, i) => (
                        <View 
                          key={i} 
                          style={[
                            styles.waveBar, 
                            { height: 10 + Math.random() * 20 }
                          ]} 
                        />
                      ))}
                    </View>
                    <Text style={styles.vocalDurationText}>0:05</Text>
                    <TouchableOpacity 
                      style={styles.vocalDeleteBtn}
                      onPress={() => {
                        Alert.alert('Supprimer le vocal ?', 'Tu pourras en réenregistrer un autre.', [
                          { text: 'Annuler', style: 'cancel' },
                          { text: 'Supprimer', style: 'destructive', onPress: () => setVocalRecorded(false) }
                        ]);
                      }}
                    >
                      <Text style={styles.vocalDeleteIcon}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity 
                    style={[styles.recordVocalBtn, isRecordingVocal && styles.recordVocalBtnActive]}
                    onPressIn={() => {
                      setIsRecordingVocal(true);
                      setVocalDuration(0);
                      // Simuler l'enregistrement
                      const interval = setInterval(() => {
                        setVocalDuration(prev => {
                          if (prev >= 5) {
                            clearInterval(interval);
                            return 5;
                          }
                          return prev + 1;
                        });
                      }, 1000);
                    }}
                    onPressOut={() => {
                      setIsRecordingVocal(false);
                      if (vocalDuration >= 3) {
                        setVocalRecorded(true);
                        Alert.alert('✅ Vocal enregistré !', 'Ton vocal de présentation est prêt.');
                      } else if (vocalDuration > 0) {
                        Alert.alert('Trop court', 'Maintiens appuyé au moins 3 secondes.');
                      }
                      setVocalDuration(0);
                    }}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={isRecordingVocal ? ['#ef4444', '#dc2626'] : ['#667eea', '#764ba2']}
                      style={styles.recordVocalGradient}
                    >
                      <Text style={styles.recordVocalIcon}>{isRecordingVocal ? '🔴' : '🎙️'}</Text>
                      <Text style={styles.recordVocalText}>
                        {isRecordingVocal ? `${vocalDuration}s / 5s` : 'Maintenir pour enregistrer'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.unlockVocalBtn}
                onPress={() => {
                  Alert.alert(
                    '🎙️ Vocal de Présentation',
                    'Débloque cette fonctionnalité pour 300 brumes.\n\nTu pourras enregistrer un vocal de 5 secondes visible sur ton profil.',
                    [
                      { text: 'Annuler', style: 'cancel' },
                      { 
                        text: 'Débloquer (300 ☁️)', 
                        onPress: () => {
                          setHasVocalPremium(true);
                          Alert.alert('✅ Fonctionnalité débloquée !', 'Tu peux maintenant enregistrer ton vocal.');
                        }
                      }
                    ]
                  );
                }}
              >
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  style={styles.unlockVocalGradient}
                >
                  <Text style={styles.unlockVocalIcon}>🔓</Text>
                  <Text style={styles.unlockVocalText}>Débloquer pour 300 ☁️</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>

          {/* Orientation & Goals */}
          <View style={styles.formCard}>
            <Text style={styles.cardTitle}>Orientation & Objectifs</Text>

            <Section title="Orientation sexuelle">
              <PillRow options={ORIENTATIONS} value={orientation} onSelect={setOrientation} />
            </Section>

            <Section title="Ce que je recherche">
              <PillRow options={GOALS} value={goal} onSelect={setGoal} />
            </Section>

            <Section title="Ton passé amoureux">
              <PillRow options={PASTS} value={past} onSelect={setPast} />
            </Section>
          </View>

          {/* Location */}
          <View style={styles.formCard}>
            <Text style={styles.cardTitle}>Localisation</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Ville</Text>
              <TextInput
                value={city}
                onChangeText={setCity}
                placeholder="Ta ville"
                placeholderTextColor="#a0aec0"
                style={styles.input}
              />
            </View>

            <Section title="Partager ma localisation ?">
              <PillRow options={["Oui", "Non"]} value={shareLocation} onSelect={setShareLocation} />
              {shareLocation === 'Oui' && (
                <TouchableOpacity style={styles.locateBtn} onPress={handleLocate} disabled={locating}>
                  <Text style={styles.locateIcon}>📍</Text>
                  <Text style={styles.locateText}>{locating ? 'Localisation...' : 'Récupérer ma position'}</Text>
                </TouchableOpacity>
              )}
            </Section>
          </View>

          {/* Personal Info */}
          <View style={styles.formCard}>
            <Text style={styles.cardTitle}>À propos de toi</Text>

            <Section title="Enfant(s)">
              <PillRow options={["Oui", "Non"]} value={hasKids} onSelect={setHasKids} />
            </Section>

            <Section title="Vis-tu seul(e) ?">
              <PillRow options={["Oui", "Non"]} value={livesAlone} onSelect={setLivesAlone} />
            </Section>
          </View>

          {/* Interests */}
          <View style={styles.formCard}>
            <Text style={styles.cardTitle}>Centres d&apos;intérêt</Text>
            <Text style={styles.cardSubtitle}>
              Sélectionne tes passions ({selectedInterests.length} sélectionnés)
            </Text>
            
            <View style={styles.interestsContainer}>
              {INTERESTS.map((item) => {
                const active = selectedInterests.includes(item);
                return (
                  <TouchableOpacity
                    key={item}
                    onPress={() => toggleInterest(item)}
                    style={[styles.interestPill, active && styles.interestPillActive]}
                  >
                    <Text style={[styles.interestText, active && styles.interestTextActive]}>{item}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveBtnGradient}
            >
              <Text style={styles.saveText}>{loading ? 'En cours...' : 'Enregistrer les modifications'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>

      {/* Photo Preview Modal */}
      <Modal
        visible={!!previewPhoto}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewPhoto(null)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalCloseArea} 
            onPress={() => setPreviewPhoto(null)}
            activeOpacity={1}
          >
            <View style={styles.modalContent}>
              {previewPhoto && (
                <>
                  {/* Blurred version */}
                  <View style={styles.modalPhotoContainer}>
                    <Text style={styles.modalLabel}>🌫️ Vue floutée (autres utilisateurs)</Text>
                    <View style={styles.modalPhotoWrapper}>
                      <Image source={{ uri: previewPhoto }} style={styles.modalPhoto} />
                      <BlurView intensity={blurIntensity} tint="default" style={styles.modalPhotoBlur} />
                    </View>
                  </View>
                  
                  {/* Clear version */}
                  <View style={styles.modalPhotoContainer}>
                    <Text style={styles.modalLabel}>✨ Vue claire (après match)</Text>
                    <Image source={{ uri: previewPhoto }} style={styles.modalPhoto} />
                  </View>
                </>
              )}
              <TouchableOpacity 
                style={styles.modalCloseBtn}
                onPress={() => setPreviewPhoto(null)}
              >
                <Text style={styles.modalCloseBtnText}>Fermer</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function PillRow({ options, value, onSelect }: { options: string[]; value: string | null; onSelect: (v: string) => void }) {
  return (
    <View style={styles.pillRow}>
      {options.map((opt) => {
        const active = value === opt;
        return (
          <TouchableOpacity
            key={opt}
            onPress={() => onSelect(opt)}
            style={[styles.pill, active && styles.pillActive]}
          >
            <Text style={[styles.pillText, active && styles.pillTextActive]}>{opt}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0f0f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 28,
    color: '#333',
    marginTop: -2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  saveHeaderBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#667eea',
  },
  saveHeaderText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },

  // Photos Section
  photosSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  blurBadge: {
    backgroundColor: '#eef2ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  blurBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#667eea',
  },
  photosSubtitle: {
    fontSize: 13,
    color: '#999',
    marginBottom: 16,
    lineHeight: 18,
  },
  photosGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  mainPhotoContainer: {
    width: (width - 32 - 20 - 12) * 0.5,
    aspectRatio: 3/4,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#f0f0f5',
  },
  photoWrapper: {
    flex: 1,
    position: 'relative',
  },
  mainPhoto: {
    width: '100%',
    height: '100%',
  },
  photoBlur: {
    ...StyleSheet.absoluteFillObject,
  },
  mainBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: '#667eea',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  mainBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  removePhotoBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removePhotoText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: -2,
  },
  addMainPhoto: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addPhotoIcon: {
    fontSize: 32,
  },
  addPhotoText: {
    fontSize: 13,
    color: '#999',
    fontWeight: '600',
  },
  secondaryPhotosContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  secondaryPhotoContainer: {
    width: '47%',
    aspectRatio: 1,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#f0f0f5',
  },
  secondaryPhoto: {
    width: '100%',
    height: '100%',
  },
  removePhotoSmallBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removePhotoSmallText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginTop: -1,
  },
  starBtn: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  starText: {
    fontSize: 12,
  },
  addSecondaryPhoto: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addSecondaryIcon: {
    fontSize: 28,
    color: '#ccc',
    fontWeight: '300',
  },
  blurInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff7ed',
    padding: 12,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  blurInfoIcon: {
    fontSize: 16,
  },
  blurInfoText: {
    flex: 1,
    fontSize: 12,
    color: '#92400e',
    lineHeight: 16,
  },

  // Preview Card
  previewCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  previewGradient: {
    height: 80,
  },
  previewContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginTop: -40,
    gap: 16,
  },
  previewAvatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: '#fff',
    backgroundColor: '#667eea',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  previewAvatarWrapper: {
    flex: 1,
    position: 'relative',
  },
  previewAvatarImage: {
    width: '100%',
    height: '100%',
  },
  previewAvatarBlur: {
    ...StyleSheet.absoluteFillObject,
  },
  previewAvatar: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewAvatarText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
  },
  previewInfo: {
    flex: 1,
  },
  previewNameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  previewName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#333',
  },
  previewAge: {
    fontSize: 18,
    color: '#666',
    fontWeight: '600',
  },
  previewCity: {
    fontSize: 14,
    color: '#999',
    marginTop: 2,
  },
  previewBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  previewTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#eef2ff',
  },
  previewTagText: {
    color: '#667eea',
    fontWeight: '700',
    fontSize: 12,
  },
  previewBio: {
    fontSize: 15,
    color: '#555',
    lineHeight: 22,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  previewEmojis: {
    fontSize: 24,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },

  // Form Card
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: -12,
    marginBottom: 16,
  },

  // Input
  inputGroup: {
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#eee',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },

  // Section
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
  },

  // Pills
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  pill: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f0f0f5',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  pillActive: {
    backgroundColor: '#eef2ff',
    borderColor: '#667eea',
  },
  pillText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 14,
  },
  pillTextActive: {
    color: '#667eea',
  },

  // Interests
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestPill: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: '#f0f0f5',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  interestPillActive: {
    backgroundColor: '#eef2ff',
    borderColor: '#667eea',
  },
  interestText: {
    color: '#666',
    fontSize: 13,
    fontWeight: '500',
  },
  interestTextActive: {
    color: '#667eea',
    fontWeight: '600',
  },

  // Location
  locateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: '#eef2ff',
    gap: 8,
  },
  locateIcon: {
    fontSize: 18,
  },
  locateText: {
    color: '#667eea',
    fontWeight: '600',
    fontSize: 14,
  },

  // Save Button
  saveBtn: {
    marginTop: 8,
    borderRadius: 20,
    overflow: 'hidden',
  },
  saveBtnGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  saveText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  modalCloseArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 350,
    alignItems: 'center',
    gap: 20,
  },
  modalPhotoContainer: {
    width: '100%',
    alignItems: 'center',
  },
  modalLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  modalPhotoWrapper: {
    width: 150,
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  modalPhoto: {
    width: 150,
    height: 200,
    borderRadius: 16,
  },
  modalPhotoBlur: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
  },
  modalCloseBtn: {
    marginTop: 10,
    paddingVertical: 14,
    paddingHorizontal: 40,
    backgroundColor: '#fff',
    borderRadius: 24,
  },
  modalCloseBtnText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '700',
  },

  // Vocal de Présentation
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  premiumBadge: {
    backgroundColor: '#667eea',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  premiumBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  vocalDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  vocalRecordContainer: {
    marginTop: 4,
  },
  vocalRecordedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f5',
    borderRadius: 16,
    padding: 12,
    gap: 12,
  },
  vocalPlayBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#667eea',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vocalPlayIcon: {
    fontSize: 16,
  },
  vocalWaveform: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  waveBar: {
    width: 4,
    backgroundColor: '#667eea',
    borderRadius: 2,
  },
  vocalDurationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  vocalDeleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vocalDeleteIcon: {
    fontSize: 16,
  },
  recordVocalBtn: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  recordVocalBtnActive: {
    transform: [{ scale: 1.02 }],
  },
  recordVocalGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  recordVocalIcon: {
    fontSize: 20,
  },
  recordVocalText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  unlockVocalBtn: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  unlockVocalGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  unlockVocalIcon: {
    fontSize: 18,
  },
  unlockVocalText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
