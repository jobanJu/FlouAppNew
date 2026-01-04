# Intégration LiveKit - FlouApp

## Vue d'ensemble

FlouApp utilise **LiveKit** pour les connexions vidéo en direct. L'architecture est conçue pour être minimaliste et respecter la philosophie FLOU.

## Architecture

### 1. Configuration
- **URL LiveKit**: `wss://flouapp-mejnaydh.livekit.cloud`
- **Variables d'environnement**: Définies dans `.env`
  - `LIVEKIT_URL`
  - `LIVEKIT_API_KEY`
  - `LIVEKIT_API_SECRET`

### 2. Hook: `useLiveKit`
Fichier: `/hooks/useLiveKit.ts`

Le hook fournit les fonctions principales :

```typescript
const { 
  createLiveRoom,  // Lance une nouvelle salle
  joinLiveRoom,    // Rejoint une salle existante
  generateToken,   // Génère un token d'accès
  loading,
  error,
  config
} = useLiveKit();
```

#### Exemple d'utilisation:

```typescript
// Créer une salle
const config = await createLiveRoom('user_id', 'userName');
// Retourne: { roomName, token, url, userName, isHost }

// Rejoindre une salle
const config = await joinLiveRoom('room-name', 'userName', false);
```

### 3. Écran Principal: `app/(tabs)/live.tsx`
- Affiche la liste des lives actifs
- Bouton **"🔴 Lancer un Live"** prominent
- Chaque live est une GlassCard avec design FLOU
- Routes vers `/live-room` pour créer/rejoindre une salle

### 4. Salle Vidéo: `app/live-room.tsx`
- Gère l'initialisation de la connexion LiveKit
- Affiche la configuration du token
- Placeholder pour la vidéo (à intégrer avec `@livekit/react-native`)

### 5. Composant d'Intégration: `lib/livekit-integration.tsx`
- Gère les permissions caméra/microphone
- Encapsule le composant `LiveKitRoom` + `VideoConference`
- Affichage des états de permission

## Flux utilisateur

### Cas 1: Créer une salle live
```
Profile.tsx
  ↓ handleLaunchLive
/live-room.tsx (isHost: true)
  ↓ useLiveKit.createLiveRoom()
  ↓ generateToken()
LiveKitIntegration (vidéo active)
```

### Cas 2: Rejoindre un live existant
```
live.tsx (liste)
  ↓ Tap card
/live-room.tsx (isHost: false, roomName: "...")
  ↓ useLiveKit.joinLiveRoom()
  ↓ generateToken()
LiveKitIntegration (vidéo active)
```

## Génération de Token

Le hook utilise `AccessToken` de `livekit-client`:

```typescript
const at = new AccessToken(apiKey, apiSecret);
at.addGrant({
  room: roomName,
  roomJoin: true,
  canPublish: isHost,      // Hôte peut publier
  canPublishData: true,    // Chat data
  canSubscribe: true,      // Tous peuvent s'abonner
});
const token = at.toJwt();
```

## Permissions requises

L'app demande automatiquement:
- **Caméra** (`expo-camera`)
- **Microphone** (`expo-camera`)
- **Audio** (configuration automatique)

État dans `livekit-integration.tsx`.

## Design FLOU

L'intégration respecte les principes FLOU:

1. **Minimalisme**: Interface épurée, pas de clutter
2. **Glassmorphism**: GlassCard pour les listes/info
3. **Progressif**: Blur progressif pas appliqué au live (vidéo nette)
4. **Emotion-first**: Questions prominentes avant de voir les gens

## Fichiers clés

```
/hooks/
  └── useLiveKit.ts           (Hook principal)

/app/(tabs)/
  ├── live.tsx                (Liste des lives)
  └── profile.tsx             (Bouton lancer live)

/app/
  └── live-room.tsx           (Salle vidéo)

/lib/
  └── livekit-integration.tsx (Composant vidéo)

/constants/
  └── theme.ts               (Styles FLOU)
```

## Configuration Supabase (À faire)

Créer une table `live_rooms`:

```sql
CREATE TABLE live_rooms (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  room_name VARCHAR UNIQUE,
  title VARCHAR,
  started_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  participant_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index pour les requêtes
CREATE INDEX ON live_rooms(is_active);
CREATE INDEX ON live_rooms(user_id);
```

## Prochaines étapes

1. ✅ Hook LiveKit et génération de token
2. ✅ Écran live.tsx avec liste
3. ✅ Écran live-room.tsx
4. ⏳ Intégrer le composant `LiveKitRoom` dans live-room.tsx
5. ⏳ Ajouter Supabase pour persister les lives
6. ⏳ Real-time updates avec Supabase subscriptions
7. ⏳ UI pour caméra/micro controls
8. ⏳ Tests multi-device

## Dépannage

### Token invalide
- Vérifier `LIVEKIT_API_KEY` et `LIVEKIT_API_SECRET` dans `.env`
- Vérifier que `room` et `roomJoin` sont dans les grants

### Problème de caméra/micro
- Vérifier les permissions dans `Settings.app` → FlouApp
- Vérifier que `useCameraPermissions()` et `useMicrophonePermissions()` sont appelées

### Problème de connexion
- Vérifier `LIVEKIT_URL` et que le serveur est accessible
- Vérifier les logs LiveKit avec `console.log()`

## Références

- [LiveKit Documentation](https://docs.livekit.io/)
- [LiveKit React Native](https://docs.livekit.io/client/react-native/)
- [AccessToken API](https://docs.livekit.io/reference/server-apis/access-token/)
