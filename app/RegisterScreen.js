import { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const INTERESTS = [
  // 🎵 MUSIQUE & ARTS (12)
  { id: 1, name: 'Musique', emoji: '🎵', category: 'Musique & Arts' },
  { id: 2, name: 'Danse', emoji: '💃', category: 'Musique & Arts' },
  { id: 3, name: 'Théâtre', emoji: '🎭', category: 'Musique & Arts' },
  { id: 4, name: 'Poésie', emoji: '✍️', category: 'Musique & Arts' },
  { id: 5, name: 'Dessin', emoji: '✏️', category: 'Musique & Arts' },
  { id: 6, name: 'Peinture', emoji: '🖌️', category: 'Musique & Arts' },
  { id: 7, name: 'Photographie', emoji: '📸', category: 'Musique & Arts' },
  { id: 8, name: 'Sculpture', emoji: '🗿', category: 'Musique & Arts' },
  { id: 9, name: 'Cinéma', emoji: '🎬', category: 'Musique & Arts' },
  { id: 10, name: 'Calligraphie', emoji: '🖋️', category: 'Musique & Arts' },
  { id: 11, name: 'Graffiti', emoji: '🎨', category: 'Musique & Arts' },
  { id: 12, name: 'Couture', emoji: '🧵', category: 'Musique & Arts' },
  // ⚽ SPORTS & ACTIVITÉS PHYSIQUES (15)
  { id: 13, name: 'Fitness', emoji: '💪', category: 'Sports & Activités' },
  { id: 14, name: 'Randonnée', emoji: '🥾', category: 'Sports & Activités' },
  { id: 15, name: 'Yoga', emoji: '🧘', category: 'Sports & Activités' },
  { id: 16, name: 'Skateboard', emoji: '🛹', category: 'Sports & Activités' },
  { id: 17, name: 'Surf', emoji: '🏄', category: 'Sports & Activités' },
  { id: 18, name: 'Vélo', emoji: '🚴', category: 'Sports & Activités' },
  { id: 19, name: 'Escalade', emoji: '🧗', category: 'Sports & Activités' },
  { id: 20, name: 'Football', emoji: '⚽', category: 'Sports & Activités' },
  { id: 21, name: 'Tennis', emoji: '🎾', category: 'Sports & Activités' },
  { id: 22, name: 'Natation', emoji: '🏊', category: 'Sports & Activités' },
  { id: 23, name: 'Boxe', emoji: '🥊', category: 'Sports & Activités' },
  { id: 24, name: 'Drones', emoji: '🚁', category: 'Sports & Activités' },
  { id: 25, name: 'Parkour', emoji: '🏃', category: 'Sports & Activités' },
  { id: 26, name: 'Équitation', emoji: '🐴', category: 'Sports & Activités' },
  { id: 27, name: 'Golf', emoji: '⛳', category: 'Sports & Activités' },
  // 📚 CULTURE & APPRENTISSAGE (13)
  { id: 28, name: 'Lecture', emoji: '📚', category: 'Culture & Apprentissage' },
  { id: 29, name: 'Écriture', emoji: '📝', category: 'Culture & Apprentissage' },
  { id: 30, name: 'Science', emoji: '🔬', category: 'Culture & Apprentissage' },
  { id: 31, name: 'Histoire', emoji: '📖', category: 'Culture & Apprentissage' },
  { id: 32, name: 'Géographie', emoji: '🗺️', category: 'Culture & Apprentissage' },
  { id: 33, name: 'Philosophie', emoji: '🤔', category: 'Culture & Apprentissage' },
  { id: 34, name: 'Psychologie', emoji: '🧠', category: 'Culture & Apprentissage' },
  { id: 35, name: 'Astronomie', emoji: '🌌', category: 'Culture & Apprentissage' },
  { id: 36, name: 'Archéologie', emoji: '🏺', category: 'Culture & Apprentissage' },
  { id: 37, name: 'Anthropologie', emoji: '👥', category: 'Culture & Apprentissage' },
  { id: 38, name: 'Linguistique', emoji: '🗣️', category: 'Culture & Apprentissage' },
  { id: 39, name: 'Langues étrangères', emoji: '🌐', category: 'Culture & Apprentissage' },
  { id: 40, name: 'Documentaires', emoji: '🎥', category: 'Culture & Apprentissage' },
  // 🎮 TECHNOLOGIE & JEUX (12)
  { id: 41, name: 'Jeux vidéo', emoji: '🎮', category: 'Tech & Jeux' },
  { id: 42, name: 'Jeux de société', emoji: '🎲', category: 'Tech & Jeux' },
  { id: 43, name: 'Jeux de cartes', emoji: '🃏', category: 'Tech & Jeux' },
  { id: 44, name: 'Informatique', emoji: '💻', category: 'Tech & Jeux' },
  { id: 45, name: 'Programmation', emoji: '👨‍💻', category: 'Tech & Jeux' },
  { id: 46, name: 'Cybersécurité', emoji: '🔐', category: 'Tech & Jeux' },
  { id: 47, name: 'Intelligence Artificielle', emoji: '🤖', category: 'Tech & Jeux' },
  { id: 48, name: 'Robotique', emoji: '🦾', category: 'Tech & Jeux' },
  { id: 49, name: 'Réalité Virtuelle', emoji: '🥽', category: 'Tech & Jeux' },
  { id: 50, name: 'Esports', emoji: '🏆', category: 'Tech & Jeux' },
  { id: 51, name: 'Streaming', emoji: '📡', category: 'Tech & Jeux' },
  { id: 52, name: 'Hackathons', emoji: '💡', category: 'Tech & Jeux' },
  // ✈️ VOYAGE & AVENTURE (10)
  { id: 53, name: 'Voyage', emoji: '✈️', category: 'Voyage & Aventure' },
  { id: 54, name: 'Camping', emoji: '⛺', category: 'Voyage & Aventure' },
  { id: 55, name: 'Backpacking', emoji: '🎒', category: 'Voyage & Aventure' },
  { id: 56, name: 'Alpinisme', emoji: '⛰️', category: 'Voyage & Aventure' },
  { id: 57, name: 'Plongée sous-marine', emoji: '🤿', category: 'Voyage & Aventure' },
  { id: 58, name: 'Skis', emoji: '⛷️', category: 'Voyage & Aventure' },
  { id: 59, name: 'Snowboard', emoji: '🏂', category: 'Voyage & Aventure' },
  { id: 60, name: 'Spéléologie', emoji: '🕳️', category: 'Voyage & Aventure' },
  { id: 61, name: 'Safari', emoji: '🦁', category: 'Voyage & Aventure' },
  { id: 62, name: 'Tourisme culinaire', emoji: '🍽️', category: 'Voyage & Aventure' },
  // 👗 MODE & BEAUTÉ (8)
  { id: 63, name: 'Mode', emoji: '👗', category: 'Mode & Beauté' },
  { id: 64, name: 'Beauté', emoji: '💄', category: 'Mode & Beauté' },
  { id: 65, name: 'Coiffure', emoji: '💇', category: 'Mode & Beauté' },
  { id: 66, name: 'Maquillage', emoji: '💅', category: 'Mode & Beauté' },
  { id: 67, name: 'Soins de la peau', emoji: '🧴', category: 'Mode & Beauté' },
  { id: 68, name: 'Streetwear', emoji: '👟', category: 'Mode & Beauté' },
  { id: 69, name: 'Luxe', emoji: '💎', category: 'Mode & Beauté' },
  { id: 70, name: 'Piercing & Tatouage', emoji: '🧿', category: 'Mode & Beauté' },
  // 🍳 GASTRONOMIE & BOISSONS (10)
  { id: 71, name: 'Cuisine', emoji: '🍳', category: 'Gastronomie' },
  { id: 72, name: 'Pâtisserie', emoji: '🎂', category: 'Gastronomie' },
  { id: 73, name: 'Boulangerie', emoji: '🥐', category: 'Gastronomie' },
  { id: 74, name: 'Café', emoji: '☕', category: 'Gastronomie' },
  { id: 75, name: 'Bière artisanale', emoji: '🍺', category: 'Gastronomie' },
  { id: 76, name: 'Vin', emoji: '🍷', category: 'Gastronomie' },
  { id: 77, name: 'Cuisine vegan', emoji: '🥗', category: 'Gastronomie' },
  { id: 78, name: 'Cocktails', emoji: '🍹', category: 'Gastronomie' },
  { id: 79, name: 'Fusion culinaire', emoji: '🍜', category: 'Gastronomie' },
  { id: 80, name: 'Fromage', emoji: '🧀', category: 'Gastronomie' },
  // 🌍 ENVIRONNEMENT & NATURE (10)
  { id: 81, name: 'Nature', emoji: '🌲', category: 'Environnement & Nature' },
  { id: 82, name: 'Animaux', emoji: '🐾', category: 'Environnement & Nature' },
  { id: 83, name: 'Jardinage', emoji: '🌿', category: 'Environnement & Nature' },
  { id: 84, name: 'Environnement', emoji: '🌍', category: 'Environnement & Nature' },
  { id: 85, name: 'Écologie', emoji: '♻️', category: 'Environnement & Nature' },
  { id: 86, name: 'Ornithologie', emoji: '🦅', category: 'Environnement & Nature' },
  { id: 87, name: 'Entomologie', emoji: '🦋', category: 'Environnement & Nature' },
  { id: 88, name: 'Aquariophilie', emoji: '🐠', category: 'Environnement & Nature' },
  { id: 89, name: 'Apiculture', emoji: '🐝', category: 'Environnement & Nature' },
  { id: 90, name: 'Zoologie', emoji: '🦓', category: 'Environnement & Nature' },
  // 🧘 BIEN-ÊTRE & SPIRITUALITÉ (10)
  { id: 91, name: 'Méditation', emoji: '🧘', category: 'Bien-être & Spiritualité' },
  { id: 92, name: 'Développement personnel', emoji: '🌱', category: 'Bien-être & Spiritualité' },
  { id: 93, name: 'Spiritualité', emoji: '🙏', category: 'Bien-être & Spiritualité' },
  { id: 94, name: 'Reiki', emoji: '💫', category: 'Bien-être & Spiritualité' },
  { id: 95, name: 'Tarot', emoji: '🔮', category: 'Bien-être & Spiritualité' },
  { id: 96, name: 'Astrologie', emoji: '♈', category: 'Bien-être & Spiritualité' },
  { id: 97, name: 'Numerologie', emoji: '🔢', category: 'Bien-être & Spiritualité' },
  { id: 98, name: 'Feng Shui', emoji: '☯️', category: 'Bien-être & Spiritualité' },
  { id: 99, name: 'Ayurvéda', emoji: '🌿', category: 'Bien-être & Spiritualité' },
  { id: 100, name: 'Holistique', emoji: '🤝', category: 'Bien-être & Spiritualité' },
];

const CITIES = [
  'Paris',
  'Lyon',
  'Marseille',
  'Toulouse',
  'Nice',
  'Nantes',
  'Strasbourg',
  'Bordeaux',
  'Lille',
  'Rennes',
];

export default function RegisterScreen() {
  const [step, setStep] = useState(1); // 1: Âge, 2: Genre, 3: Intérêts, 4: Ville, 5: Résumé
  const [age, setAge] = useState('');
  const [gender, setGender] = useState(null);
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [selectedCity, setSelectedCity] = useState(null);

  // Vérifier l'âge (minimum 20 ans)
  const handleAgeSubmit = () => {
    if (!age) {
      Alert.alert('Erreur', 'Veuillez entrer votre âge');
      return;
    }
    const userAge = parseInt(age);
    if (userAge < 20) {
      Alert.alert('Accès refusé', 'Cette application est réservée aux personnes de 20 ans ou plus.');
      return;
    }
    setStep(2);
  };

  // Sélectionner un genre
  const handleGenderSelect = (selectedGender) => {
    setGender(selectedGender);
    setStep(3);
  };

  // Sélectionner les intérêts (maximum 10)
  const toggleInterest = (interestId) => {
    if (selectedInterests.includes(interestId)) {
      setSelectedInterests(selectedInterests.filter(id => id !== interestId));
    } else {
      if (selectedInterests.length < 10) {
        setSelectedInterests([...selectedInterests, interestId]);
      } else {
        Alert.alert('Limite atteinte', 'Vous pouvez sélectionner maximum 10 intérêts');
      }
    }
  };

  // Aller à la sélection de ville
  const handleInterestsNext = () => {
    if (selectedInterests.length === 0) {
      Alert.alert('Erreur', 'Veuillez sélectionner au moins un intérêt');
      return;
    }
    setStep(4);
  };

  // Aller au résumé
  const handleCitySelect = (city) => {
    setSelectedCity(city);
    setStep(5);
  };

  // Soumettre le formulaire
  const handleSubmit = () => {
    Alert.alert(
      'Inscription réussie!',
      `Âge: ${age}\nGenre: ${gender}\nIntérêts: ${selectedInterests.length}\nVille: ${selectedCity}`
    );
    // Ici, vous pouvez ajouter la logique pour sauvegarder les données
  };

  return (
    <ScrollView style={styles.container}>
      {/* ÉTAPE 1: ÂGE */}
      {step === 1 && (
        <View style={styles.stepContainer}>
          <Text style={styles.title}>Quel est ton âge?</Text>
          <Text style={styles.subtitle}>Tu dois avoir au minimum 20 ans</Text>
          
          <TextInput
            style={styles.ageInput}
            placeholder="Entrez votre âge"
            keyboardType="numeric"
            value={age}
            onChangeText={setAge}
            placeholderTextColor="#999"
          />
          
          <TouchableOpacity style={styles.button} onPress={handleAgeSubmit}>
            <Text style={styles.buttonText}>Continuer</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ÉTAPE 2: GENRE */}
      {step === 2 && (
        <View style={styles.stepContainer}>
          <Text style={styles.title}>Quel est ton genre?</Text>
          
          <TouchableOpacity
            style={[styles.optionButton, gender === 'Homme' && styles.optionButtonSelected]}
            onPress={() => handleGenderSelect('Homme')}
          >
            <Text style={styles.optionText}>👨 Homme</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.optionButton, gender === 'Femme' && styles.optionButtonSelected]}
            onPress={() => handleGenderSelect('Femme')}
          >
            <Text style={styles.optionText}>👩 Femme</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.optionButton, gender === 'Autre' && styles.optionButtonSelected]}
            onPress={() => handleGenderSelect('Autre')}
          >
            <Text style={styles.optionText}>🌈 Autre</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ÉTAPE 3: INTÉRÊTS */}
      {step === 3 && (
        <View style={styles.stepContainer}>
          <Text style={styles.title}>Tes centres d&apos;intérêt</Text>
          <Text style={styles.subtitle}>Sélectionne jusqu&apos;à 10 ({selectedInterests.length}/10)</Text>
          
          <View style={styles.interestsGrid}>
            {INTERESTS.map(interest => (
              <TouchableOpacity
                key={interest.id}
                style={[
                  styles.interestTag,
                  selectedInterests.includes(interest.id) && styles.interestTagSelected
                ]}
                onPress={() => toggleInterest(interest.id)}
              >
                <Text style={styles.interestEmoji}>{interest.emoji}</Text>
                <Text style={styles.interestName}>{interest.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <TouchableOpacity style={styles.button} onPress={handleInterestsNext}>
            <Text style={styles.buttonText}>Continuer</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ÉTAPE 4: VILLE */}
      {step === 4 && (
        <View style={styles.stepContainer}>
          <Text style={styles.title}>Quelle est ta ville?</Text>
          <Text style={styles.subtitle}>📍 Sélectionne ta ville</Text>
          
          <View style={styles.citiesContainer}>
            {CITIES.map((city, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.cityButton,
                  selectedCity === city && styles.cityButtonSelected
                ]}
                onPress={() => handleCitySelect(city)}
              >
                <Text style={[
                  styles.cityText,
                  selectedCity === city && styles.cityTextSelected
                ]}>
                  {city}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* ÉTAPE 5: RÉSUMÉ */}
      {step === 5 && (
        <View style={styles.stepContainer}>
          <Text style={styles.title}>Résumé de ton profil</Text>
          
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>👤 Âge:</Text>
            <Text style={styles.summaryValue}>{age} ans</Text>
            
            <Text style={styles.summaryLabel}>Gender:</Text>
            <Text style={styles.summaryValue}>{gender}</Text>
            
            <Text style={styles.summaryLabel}>🎯 Intérêts:</Text>
            <View style={styles.summaryInterests}>
              {selectedInterests.map(interestId => {
                const interest = INTERESTS.find(i => i.id === interestId);
                return (
                  <View key={interestId} style={styles.summaryTag}>
                    <Text style={styles.summaryTagText}>{interest.emoji} {interest.name}</Text>
                  </View>
                );
              })}
            </View>
            
            <Text style={styles.summaryLabel}>📍 Ville:</Text>
            <Text style={styles.summaryValue}>{selectedCity}</Text>
          </View>
          
          <TouchableOpacity style={styles.button} onPress={handleSubmit}>
            <Text style={styles.buttonText}>Créer mon profil</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.backButton} onPress={() => setStep(4)}>
            <Text style={styles.backButtonText}>Retour</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    paddingVertical: 40,
  },
  stepContainer: {
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
    marginBottom: 30,
  },
  
  // Âge
  ageInput: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    marginBottom: 30,
  },
  
  // Boutons d'options
  optionButton: {
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: '#333',
    borderRadius: 12,
    padding: 18,
    marginBottom: 12,
  },
  optionButtonSelected: {
    borderColor: '#ff6b6b',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
  },
  optionText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  
  // Intérêts (grille)
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  interestTag: {
    width: '48%',
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: '#333',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  interestTagSelected: {
    borderColor: '#ff6b6b',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
  },
  interestEmoji: {
    fontSize: 24,
    marginBottom: 6,
  },
  interestName: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
  
  // Villes
  citiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  cityButton: {
    width: '48%',
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: '#333',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  cityButtonSelected: {
    borderColor: '#ff6b6b',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
  },
  cityText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  cityTextSelected: {
    color: '#ff6b6b',
  },
  
  // Résumé
  summaryBox: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 6,
  },
  summaryValue: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  summaryInterests: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  summaryTag: {
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  summaryTagText: {
    fontSize: 12,
    color: '#ff6b6b',
    fontWeight: '600',
  },
  
  // Boutons
  button: {
    backgroundColor: '#ff6b6b',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  backButton: {
    backgroundColor: '#333',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
  },
});
