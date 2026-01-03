# 🌊 FlouApp

Une application mobile Expo/React Native pour connecter les surfeurs et les amateurs d'eau.

## 🚀 Démarrage rapide

### Installation
```bash
npm install
```

### Démarrage du serveur
```bash
npm start
```

Ensuite, appuyez sur:
- `i` pour iOS
- `a` pour Android  
- `w` pour Web

## 📱 Caractéristiques

- **Onboarding complet** - Authentification et configuration initiale
- **Système de tabs** - Navigation par onglets (Accueil, Messages, Explore, Live, Shop)
- **Messages en direct** - Système de messagerie instantanée
- **Vidéo en direct** - Transmission en direct avec LiveKit
- **Shop** - Boutique intégrée avec Stripe
- **Paramètres utilisateur** - Profil, blocage, support

## 🛠️ Structure du projet

```
app/
├── (tabs)/           # Écrans principaux avec navigation par onglets
├── settings/         # Écrans de paramètres
├── onboarding.tsx    # Écran d'accueil/authentification
├── live-room.tsx     # Salle de vidéo en direct
└── _layout.tsx       # Layout racine

components/
└── HideKeyboardArrow.tsx  # Composant utilitaire

assets/
├── images/           # Images et icônes
constants/           # Configuration du thème

lib/                  # Fonctions utilitaires
supabase/            # Configuration Supabase
```

## 🔑 Variables d'environnement

Le fichier `.env` est configuré avec:
- LIVEKIT_URL
- LIVEKIT_API_KEY
- LIVEKIT_API_SECRET

## 📚 Dépendances principales

- **Expo 54** - Framework React Native
- **React 19** - Librairie UI
- **Expo Router** - Navigation
- **LiveKit** - Vidéo en direct
- **Supabase** - Backend et authentification
- **Stripe** - Paiements

## 🚀 Commandes

```bash
npm start       # Démarrer l'app
npm run android # Démarrer sur Android
npm run ios     # Démarrer sur iOS
npm run web     # Démarrer sur Web
npm run lint    # Vérifier le code
```

## 👨‍💻 Auteur

jobanJu
