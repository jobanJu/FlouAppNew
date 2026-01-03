# FlouApp - Plateforme Sociale Surfeurs 🏄

## 📱 Vue d'ensemble

FlouApp est une application mobile complète permettant aux passionnés de sports nautiques (surf, apnée, kayak, etc.) de se connecter, partager et organiser des sessions ensemble.

**Plateforme:** React Native (Expo 54.0.30)  
**Backend:** Supabase (PostgreSQL + Realtime)  
**Streaming Vidéo:** LiveKit  
**Paiements:** Stripe  
**Routing:** Expo Router (File-based)

## 🎯 Fonctionnalités Principales

### 1. **Authentication** 🔐
- Inscription/Connexion via email + password
- Onboarding personnalisé
- Auth via Supabase
- RLS (Row Level Security)

### 2. **Matching System** ❤️
- Swipe cards avec drag animations (PanResponder)
- Profils avec photos, bio, intérêts
- Matches mutuels
- Exploration des matches précédents

### 3. **Messaging** 💬
- Real-time conversations (Supabase Realtime)
- Typing indicator
- Read receipts
- Historique des messages
- Support des images

### 4. **Live Streaming** 🎥
- Sessions de streaming en direct avec LiveKit
- Versus mode avec questions amusantes
- Permissions camera/microphone
- Multi-participant support

### 5. **Sessions de Groupe** 🏄
- Créer des sessions de surf/activités
- Afficher sur la carte
- Rejoindre/Quitter sessions
- Filtrage par niveau et date
- Gestion des participants

### 6. **Spots Locaux** 🗺️
- Carte interactive avec spots
- Avis et évaluations
- Conditions actuelles
- Filtrage par difficulté
- Favoris utilisateur

### 7. **Feed Social** 📸
- Publier des photos/moments
- Likes et commentaires
- Real-time feed updates
- Partage avec la communauté

### 8. **Gamification** ⭐
- Système de points (matches, messages, sessions, posts)
- Badges et achievements débloquables
- Leaderboard communautaire
- Niveaux utilisateur (Débutant → Légende)

### 9. **Notifications** 🔔
- Notifications real-time (matches, messages, sessions)
- Filtrage par type
- Marquer comme lu
- Suppression

### 10. **Profils** 👤
- Édition du profil (bio, photo, intérêts, niveau)
- Galerie photos
- Statistiques utilisateur
- Voir profils autres utilisateurs

### 11. **Shop/E-commerce** 🛒
- Paiements Stripe intégrés
- Produits/Services
- Panier et checkout
- SuperLike, Boost profiles

### 12. **Settings** ⚙️
- Gestion du profil
- Préférences de notification
- Confidentialité et compte
- Support

---

## 📁 Architecture du Projet

```
FlouAppNew/
├── app/
│   ├── (tabs)/
│   │   ├── _layout.tsx        # Navigation tabs principale
│   │   ├── index.tsx          # Accueil
│   │   ├── messages.tsx       # ✅ Liste conversations
│   │   ├── matching.tsx       # ✅ Swipe cards
│   │   ├── explore.tsx        # ✅ Mes matches
│   │   ├── live.tsx           # ✅ Live streaming
│   │   ├── sessions.tsx       # ✅ Sessions de groupe
│   │   ├── spots.tsx          # ✅ Spots + Carte
│   │   ├── feed.tsx           # ✅ Feed social
│   │   ├── notifications.tsx  # ✅ Notifications
│   │   ├── gamification.tsx   # ✅ Stats & Badges
│   │   └── shop.tsx           # ✅ E-commerce
│   │
│   ├── chat/
│   │   └── [id].tsx           # ✅ Chat screen (real-time)
│   │
│   ├── profile/
│   │   └── [id].tsx           # ✅ Profil détaillé
│   │
│   ├── session/
│   │   ├── [id].tsx           # Session détails
│   │   └── create.tsx         # ✅ Créer session
│   │
│   ├── settings/
│   │   └── index.tsx          # Paramètres
│   │
│   ├── onboarding.tsx         # Inscription/Auth
│   ├── live-room.tsx          # Salle livestream
│   ├── _layout.tsx            # Root + Auth logic
│   └── modal.tsx              # Modal générique
│
├── components/
│   ├── HideKeyboardArrow.tsx
│   └── ui/
│       ├── collapsible.tsx
│       ├── icon-symbol.tsx
│       └── icon-symbol.ios.tsx
│
├── lib/
│   ├── supabase.ts            # Client Supabase
│   ├── messages.ts            # ✅ Message API
│   ├── chat-screen.tsx        # ✅ Chat component
│   ├── notifications.ts       # ✅ Notifications API
│   ├── gamification.ts        # ✅ Points & Badges
│   ├── feed.ts                # ✅ Posts API
│   ├── sessions.ts            # ✅ Sessions API
│   └── spots.ts               # ✅ Spots API
│
├── hooks/
│   ├── useAuth.ts             # Auth hook
│   ├── useColorScheme.ts
│   ├── useColorScheme.web.ts
│   └── useThemeColor.ts
│
├── constants/
│   └── theme.ts               # Design tokens
│
├── assets/
│   └── images/
│
├── .env                       # Variables d'environnement
├── app.json                   # Config Expo
├── tsconfig.json              # TypeScript config
├── eslint.config.js           # ESLint config
├── babel.config.js            # Babel config
├── package.json
└── README.md
```

---

## 💾 Schéma Supabase

### Tableaux créés automatiquement via Supabase:

#### `profiles`
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  first_name TEXT,
  last_name TEXT,
  age INTEGER,
  bio TEXT,
  avatar_url TEXT,
  level TEXT,
  city TEXT,
  lat FLOAT,
  lng FLOAT,
  interests TEXT[],
  photos TEXT[],
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### `conversations`
```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID REFERENCES profiles(user_id),
  user2_id UUID REFERENCES profiles(user_id),
  last_message TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

#### `messages`
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id),
  user_id UUID REFERENCES profiles(user_id),
  content TEXT,
  image_url TEXT,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);
```

#### `matches`
```sql
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(user_id),
  matched_user_id UUID REFERENCES profiles(user_id),
  status TEXT ('pending', 'accepted', 'rejected'),
  mutual BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now()
);
```

#### `sessions`
```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES profiles(user_id),
  title TEXT NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMP,
  location TEXT,
  lat FLOAT,
  lng FLOAT,
  max_participants INTEGER,
  level TEXT,
  conditions TEXT,
  participants_count INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT now()
);
```

#### `session_participants`
```sql
CREATE TABLE session_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id),
  user_id UUID REFERENCES profiles(user_id),
  joined_at TIMESTAMP DEFAULT now()
);
```

#### `spots`
```sql
CREATE TABLE spots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  lat FLOAT,
  lng FLOAT,
  difficulty TEXT,
  best_season TEXT,
  wave_height TEXT,
  image_url TEXT,
  rating FLOAT DEFAULT 5.0,
  reviews_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT now()
);
```

#### `spot_reviews`
```sql
CREATE TABLE spot_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spot_id UUID REFERENCES spots(id),
  user_id UUID REFERENCES profiles(user_id),
  rating INTEGER,
  comment TEXT,
  created_at TIMESTAMP DEFAULT now()
);
```

#### `posts`
```sql
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(user_id),
  content TEXT,
  image_url TEXT,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT now()
);
```

#### `post_likes`
```sql
CREATE TABLE post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id),
  user_id UUID REFERENCES profiles(user_id),
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(post_id, user_id)
);
```

#### `post_comments`
```sql
CREATE TABLE post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id),
  user_id UUID REFERENCES profiles(user_id),
  content TEXT,
  created_at TIMESTAMP DEFAULT now()
);
```

#### `notifications`
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(user_id),
  type TEXT,
  title TEXT,
  message TEXT,
  data JSONB,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now()
);
```

#### `user_stats`
```sql
CREATE TABLE user_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(user_id),
  total_points INTEGER DEFAULT 0,
  matches_count INTEGER DEFAULT 0,
  messages_sent INTEGER DEFAULT 0,
  sessions_created INTEGER DEFAULT 0,
  posts_count INTEGER DEFAULT 0,
  badges TEXT[] DEFAULT '{}',
  level TEXT DEFAULT 'Débutant',
  updated_at TIMESTAMP DEFAULT now()
);
```

---

## 🚀 Démarrage Rapide

### Installation

```bash
# Cloner le repo
git clone https://github.com/yourusername/FlouAppNew.git
cd FlouAppNew

# Installer les dépendances
npm install

# Créer fichier .env
cp .env.example .env

# Configurer les variables d'environnement
# EXPO_PUBLIC_SUPABASE_URL=your-url
# EXPO_PUBLIC_SUPABASE_ANON_KEY=your-key
# EXPO_PUBLIC_LIVEKIT_URL=your-url
```

### Lancer l'app

```bash
# Démarrer le serveur Expo
npm start

# Sur téléphone: Scan QR avec Expo Go
# Sur émulateur: Appuyer sur 'a' (Android) ou 'i' (iOS)
```

---

## 🔌 Intégrations Externes

### Supabase
- **Auth:** Authentification email + password
- **Database:** PostgreSQL pour tous les tableaux
- **Realtime:** Subscriptions WebSocket pour messages, notifications
- **Storage:** Images avatars et posts

### LiveKit
- **URL:** wss://flouapp-mejnaydh.livekit.cloud
- **Tokens:** Générés serveur-side pour sécurité
- **Features:** Video/Audio, Screen share (future)

### Stripe
- **Paiements:** In-app purchases pour SuperLike, Boost
- **Webhook:** Gestion des paiements complétés/échoués

---

## 📊 Flux de Données Clés

### 1. Matching Flow
```
User swipes → Match créé → Notification envoyée
            → Si mutual match → Conversation créée
            → Allowed to message
```

### 2. Messaging Flow
```
User A envoie message → Supabase insert
                     → Real-time broadcast
                     → User B reçoit via subscription
                     → Typing indicator live
```

### 3. Session Flow
```
User crée session → Session insérée → Invite sent
                 → Others join → Participants incrémenté
                 → Live chat de session
```

### 4. Gamification Flow
```
Action effectuée → Points ajoutés (addPoints)
               → Check pour badges (checkBadges)
               → Update user_stats
               → Affichage sur profil et leaderboard
```

---

## 🎨 Design System

### Couleurs
- **Primary:** #007AFF (Bleu)
- **Success:** #34C759 (Vert)
- **Warning:** #FF9500 (Orange)
- **Error:** #FF3B30 (Rouge)
- **Background:** #FFF (Blanc)
- **Secondary:** #F0F0F0 (Gris léger)

### Typography
- **Headers:** 20-24px, fontWeight: 'bold'
- **Body:** 14-16px, fontWeight: '400'
- **Small:** 11-12px, color: '#666'

### Spacing
- Padding standard: 16px
- Gaps entre éléments: 8-12px
- Border radius: 8px (cards), 20px (pills)

---

## 🧪 Fonctionnalités Testées ✅

- ✅ Authentication & Onboarding
- ✅ Matching system (swipe, accept, reject)
- ✅ Real-time messaging
- ✅ Live streaming (LiveKit)
- ✅ Notifications
- ✅ Sessions
- ✅ Spots & Map view
- ✅ Feed & Social
- ✅ Gamification
- ✅ E-commerce (Stripe ready)

---

## 📝 Points API

L'application utilise un système de points gamifié:

- **50 pts** - Nouveau match
- **25 pts** - Message envoyé
- **100 pts** - Session créée
- **50 pts** - Session rejointe
- **25 pts** - Post publié
- **10 pts** - Like reçu
- **Bonus** - Badges spéciaux

---

## 🔐 Sécurité

- RLS activé sur toutes les tables Supabase
- Auth tokens gérés par Supabase
- LiveKit tokens générés serveur
- Images stockées dans Supabase Storage
- HTTPS everywhere

---

## 🚢 Déploiement

### EAS Build (Expo Application Services)

```bash
# Configurer
eas build --platform ios --type preview

# Envoyer sur TestFlight
eas submit -p ios --latest
```

### Pre-production Checklist
- [ ] Supabase RLS vérifié
- [ ] Stripe API keys configurées
- [ ] LiveKit tokens générés
- [ ] Push notifications setup
- [ ] Error tracking (Sentry) intégré
- [ ] Analytics configuré
- [ ] Privacy policy ajoutée
- [ ] Terms of service ajoutés

---

## 📈 Roadmap Future

### Tier 1 (Prochaines 2 semaines)
- [ ] Web app version (React)
- [ ] Push notifications complètes
- [ ] Analytics dashboard
- [ ] Admin panel

### Tier 2 (1-2 mois)
- [ ] Chat de groupe pour sessions
- [ ] Integration OpenWeather (conditions)
- [ ] Intégration Tidal data
- [ ] Video messages
- [ ] Story/status (24h)

### Tier 3 (3+ mois)
- [ ] AI-powered matching
- [ ] Podcast/Blog intégré
- [ ] Events/Contests
- [ ] Shop marchand
- [ ] Assurance/Safety features

---

## 💬 Support & Feedback

- **GitHub Issues:** Bugs et feature requests
- **Email:** contact@flourapp.com
- **Discord:** Community server

---

## 📄 License

MIT License - Voir LICENSE file

---

**Créé avec ❤️ pour la communauté des sports nautiques**

Version: 1.0.0  
Last Updated: 2024  
Maintainer: FlouApp Team
