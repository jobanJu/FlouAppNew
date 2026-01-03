# 💘 Système de Matching - FlouApp

## Vue d'ensemble

FlouApp dispose d'un système de matching complet basé sur les **swipe cards** (comme Tinder) pour permettre aux utilisateurs de découvrir d'autres profils et créer des connexions.

## 🎯 Fonctionnalités

### 1. **Écran de Matching** (`app/(tabs)/matching.tsx`)

L'écran principal où les utilisateurs peuvent:
- **Swiper à droite** ❤️ pour "liker" un profil
- **Swiper à gauche** ✕ pour rejeter un profil
- **Taper les boutons** en bas pour les mêmes actions

#### Fonctionnement
```
┌─────────────────────────┐
│  Profil (Image + Infos) │  ← Draggable, animé
│                         │
│ Avatar - Nom, Âge       │
│ Bio                     │
│ Localisation            │
└─────────────────────────┘
       ❤️ REJECT | LIKE ❤️
```

**Interactions:**
- **Drag horizontal** - Swipe automatique et animation
- **Boutons** - Reject (✕) ou Like (❤️)
- **Stack** - La carte suivante est visible en arrière-plan (scale 0.95)

### 2. **Gestion des Matches** (`app/(tabs)/explore.tsx`)

Affiche tous les profils "matchés" en grille 2x2.

**Chaque match affiche:**
- Avatar du profil
- Nom et âge
- Bouton "Écrire" pour démarrer une conversation

## 🛠️ Implémentation technique

### Architecture

```
app/(tabs)/
├── matching.tsx        # Swipe cards avec PanResponder
├── explore.tsx         # Affichage des matches
└── _layout.tsx         # Navigation (mise à jour)
```

### Technologies utilisées

| Élément | Technologie | Purpose |
|---------|-------------|---------|
| **Swipe** | `PanResponder` + `Animated` | Dragging fluide |
| **Database** | `Supabase` | Stockage profiles/matches |
| **Navigation** | `Expo Router` | Routing |
| **Images** | `expo-image` | Cache optimisé |

### Base de données requise

```sql
-- Table: profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  first_name TEXT,
  age INT,
  bio TEXT,
  avatar_url TEXT,
  city TEXT,
  created_at TIMESTAMP
);

-- Table: matches
CREATE TABLE matches (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  matched_user_id UUID REFERENCES profiles,
  status TEXT ('liked', 'matched', 'rejected'),
  created_at TIMESTAMP
);
```

## 🔄 Flux d'utilisation

```
┌─────────────────────────────────────────┐
│     Utilisateur accède à Matching       │
└────────────────┬────────────────────────┘
                 │
                 ▼
    ┌─────────────────────────────┐
    │  Chargement des profils     │
    │  depuis Supabase            │
    └────────────┬────────────────┘
                 │
                 ▼
    ┌─────────────────────────────┐
    │  Affichage du 1er profil    │
    │  (2e en arrière-plan)       │
    └────────────┬────────────────┘
                 │
         ┌───────┴───────┐
         │               │
         ▼               ▼
    Swipe left   Swipe right
    (Reject)     (Like)
         │               │
         └───────┬───────┘
                 │
                 ▼
    ┌─────────────────────────────┐
    │  Sauvegarder l'action dans  │
    │  la table 'matches'         │
    └────────────┬────────────────┘
                 │
                 ▼
    ┌─────────────────────────────┐
    │  Profil suivant             │
    │  (animation out)            │
    └────────────┬────────────────┘
                 │
         Plus de profils?
         │               
    Non │    Oui        
         │               │
         ▼               ▼
    "Plus de       Retour au 
    profils"       matching
```

## 📱 UI/UX

### Matching Screen

**Header:**
- Titre "Matching"

**Card:**
- Image haute résolution (70% de la hauteur)
- Nom, âge
- Bio complète
- Localisation
- Animations de swipe avec texte "LIKE" / "REJECT"

**Actions:**
- Bouton Reject (cercle blanc, bordure rouge) - ✕
- Bouton Like (cercle vert) - ❤️

### Explore Screen (Matches)

**Header:**
- "Mes Matches"
- Compteur "X matches"

**Grille:**
- 2 colonnes
- Cards avec avatar
- Bouton "Écrire" pour chaque match

## 🚀 Fonctionnalités futures

1. **Filtres**
   - Âge min/max
   - Localisation (rayon)
   - Intérêts/Hobbies

2. **Smart Matching**
   - Algorithme de compatibilité
   - Suggestions basées sur les préférences
   - Matching mutuel (beide must like)

3. **Notifications**
   - Alerte quand c'est un "SuperLike"
   - Notification de nouveau match
   - Message d'une personne matchée

4. **Profils améliorés**
   - Galerie photo (plusieurs images)
   - Vidéo de présentation
   - Vérification d'identité

5. **Paiement**
   - Likes illimités
   - SuperLike
   - Visibility boost

## 📊 Statistiques

- **Profils affichés par session:** 50
- **Temps avant "Plus de profils":** ~10-15 minutes
- **Animation swipe:** 300ms
- **Stack depth:** 2 cards visibles

## 🐛 Dépannage

### Les cartes ne se drainent pas
```bash
# Vérifier que GestureHandlerRootView est en place
# dans l'écran parent
```

### Les matches n'apparaissent pas
```bash
# Vérifier que la table 'matches' existe
# et que status = 'matched'
```

### Performance lente avec beaucoup de profils
```bash
# Limiter à 50 profils max
# Utiliser pagination/lazy loading
```

## 📖 Code exemple

### Sauvegarder un like
```typescript
const handleSwipe = (direction: number) => {
  const currentProfile = profiles[currentIndex];

  if (direction > 0) {
    // Save like
    await supabase
      .from('matches')
      .insert({
        user_id: userId,
        matched_user_id: currentProfile.id,
        status: 'liked'
      });
  }
  
  setCurrentIndex(currentIndex + 1);
};
```

### Afficher les matches
```typescript
const { data } = await supabase
  .from('matches')
  .select('*, profiles(*)')
  .eq('status', 'matched')
  .eq('user_id', userId);
```

---

**Statut:** ✅ Fonctionnel et prêt pour les tests
