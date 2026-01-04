# 🎯 FLOU APP - ARCHITECTURE & ROADMAP

## ✅ PHASE 1 - MVP SOLIDE (EN COURS)

### 1️⃣ **Schéma Supabase** ✅ COMPLÉTÉ
- ✅ Table `users` (profil, bio, subscription, wallet)
- ✅ Table `photos` (avec face_detected)
- ✅ Table `matches` (status: day1/day2/day3, messages_count)
- ✅ Table `messages` (messages texte)
- ✅ Table `live_rooms` (pour groupé)
- ✅ Table `love_dates` (pour 1v1)
- ✅ Table `gifts` (cadeaux Brumes)
- ✅ RLS policies configurées
- ✅ Indexes optimisés

### 2️⃣ **Logique de défloutage** ✅ COMPLÉTÉ
- ✅ `lib/blur-logic.ts` - Calcul blur level (0-100)
- ✅ `getBlurLevel()` - J1:100% → J2:50% → J3:0%
- ✅ `canUnlockDay2()` - Threshold: 3 messages par personne (6 total)
- ✅ `canUnlockDay3()` - Threshold: 6 messages par personne (12 total)
- ✅ `getUnlockProgress()` - Progression visuelle
- ✅ `useBlurLogic()` - Hook React

### 3️⃣ **Edge Function de défloutage** ✅ COMPLÉTÉ
- ✅ `supabase/functions/update-match-status/index.ts`
- ✅ Appelée après INSERT message
- ✅ Compte messages automatiquement
- ✅ Détecte seuils et met à jour match.status
- ✅ Enregistre timestamps des déverrouillages

### 4️⃣ **UI Défloutage progressif** ✅ COMPLÉTÉ
- ✅ `components/BlurProgressiveCard.tsx`
- ✅ Affiche photo avec BlurView selon status
- ✅ Barre de progression interactive
- ✅ Messages d'encouragement
- ✅ Badge statut (🌫️ J1 / ⏳ J2 / ✅ J3)

### 5️⃣ **Hook Messages temps réel** ✅ COMPLÉTÉ
- ✅ `hooks/useMessages.ts`
- ✅ Chargement messages
- ✅ Real-time subscription
- ✅ Compter messages automatiquement
- ✅ Envoyer / Marquer comme lu

### 6️⃣ **Photo de profil test** ✅ COMPLÉTÉ
- ✅ Remplacée par `assets/images/profiltestfemmme.JPG`
- ✅ Configurée dans profile.tsx et live.tsx

---

## 🎯 TODO - PHASE 1 (À faire)

### A. Messages texte dans UI ⏳
- [ ] Implémenter `app/(tabs)/messages.tsx` complet
  - Lister les matches
  - Chat en temps réel
  - Compteur de messages
  - Indicateur déverrouillage
  
### B. Déployer Edge Function ⏳
- [ ] Créer le trigger SQL dans Supabase
- [ ] Déployer: `supabase functions deploy`
- [ ] Tester: Envoyer messages → J2/J3 déverrouillent

### C. Intégrer BlurProgressiveCard dans swipe ⏳
- [ ] Remplacer BlurImage par BlurProgressiveCard dans `app/(tabs)/index.tsx`
- [ ] Passer les données du match
- [ ] Afficher progression réelle

### D. Tester complet MVP ⏳
- [ ] 2 profils de test
- [ ] Créer un match
- [ ] Envoyer 6 messages → J2 déverrouille
- [ ] Envoyer 12 messages → J3 déverrouille
- [ ] Vérifier BlurView progression

---

## 🚀 PHASE 2 - DIFFÉRENCIATION

### Live Audio (groupe + 1v1)
- [ ] `app/(tabs)/live.tsx` - Liste des lives
- [ ] Intégrer LiveKit groupé (max 4 participants)
- [ ] Love Date 1v1:
  - [ ] Timer 1m30s
  - [ ] Questions/réponses (6/10 = déverrouille)
  - [ ] Verdict final obligatoire
  - [ ] Déverrouillage instant

### Audio Bio
- [ ] `expo-av` recording
- [ ] Lecteur audio dans profil
- [ ] Upload à Supabase

### Cadeaux Brumes
- [ ] UI sélection cadeaux
- [ ] Débit Brumes automatique
- [ ] Notification temps réel
- [ ] Animation d'arrivée

---

## 💰 PHASE 3 - MONÉTISATION

- [ ] Abonnements (free / kama / cupidon)
- [ ] Publicités
- [ ] Créateurs (revenus livestream)

---

## 📊 Schéma modèles clés

### Match Status Transitions
```
NEW MATCH
    ↓
[day1] (0% flou) ← J1 commence
    ↓ (6 messages)
[day2] (50% flou) ← Photo partiellement visible
    ↓ (12 messages)
[day3] (0% flou) ← Photo claire, match "qualifié"
```

### Message Thresholds
```
Messages: 0                  6                    12
          |══════════════════|══════════════════|
Status:   Day1              Day2                Day3
Blur:     100%              50%                 0%
          🌫️ Photo floue   👥 Silhouette      ✅ Claire
```

---

## 🛠️ Commandes clés

### Tester localement
```bash
npm start
# Ouvrir Expo sur appareil
# Onglet Swipe (⊙) → Voir profils avec blur progressif
# Onglet Live (●) → Créer live groupé / Love Date
```

### Déployer Edge Function
```bash
supabase functions deploy update-match-status --project-id <PROJECT_ID>
```

### Ajouter seed data
```bash
supabase db push
# ou via Supabase Studio
```

---

## 📱 Interfaces clés

### 1. Swipe Screen (index.tsx)
```
┌─────────────────────┐
│  Photo (J2: 50%)    │ ← BlurProgressiveCard
│  "Emma, 24"         │
│  [❤️] [💬] [❌]      │ ← Actions
│                     │
│ 4 messages for J3   │ ← Progress bar
└─────────────────────┘
```

### 2. Messages Screen (messages.tsx)
```
┌─────────────────────┐
│ Emma, 24            │
│ 🌫️ J1 - 2/6 msgs   │ ← Status badge
├─────────────────────┤
│ "Salut! Ça va?"  ← │ (sender)
│                  ← │
│ "Bien et toi?"   ← │ (receiver)
│                     │ (Auto J2 → J3)
├─────────────────────┤
│ [Type message...]   │
│ [Envoyer]           │
└─────────────────────┘
```

### 3. Live Screen (live.tsx)
```
┌─────────────────────┐
│ ● Lives en direct   │
│                     │
│ [🔴 Lancer un Live] │ ← CTA principale
│                     │
│ Léa (25)            │ ← GlassCard
│ "Qu'est-ce que tu   │
│  cherches?"         │
│ 👥 5 connectés      │
│ [→ Rejoindre]       │
└─────────────────────┘
```

---

## 🔑 Architecture décisions

### Pourquoi ce seuil (3 messages / J2)?
- **Court**: Assez pour briser la glace
- **Sécurisé**: Pas de spam, interaction réelle
- **Fair**: À la fois découragent les bots et les faux profils

### Pourquoi BlurView progressif?
- **Emotion-first**: On découvre la personne via messages
- **FLOU philosophy**: Pas de jugement sur l'apparence
- **Gamification**: Progression satisfaisante

### Pourquoi Love Date séparé?
- **Intention**: Questions guidées = meilleur matching
- **Format**: 1v1 + timer = conversation authentique
- **Déverrouillage**: Instant si 6/10 réponses match

---

## 📚 Files à garder en tête

```
FlouAppNew/
├── supabase/
│   ├── schema.sql                 ← Modèles PHASE 1
│   └── functions/
│       └── update-match-status/   ← Edge Function
│
├── lib/
│   ├── blur-logic.ts              ← Logic thresholds
│   └── supabase.ts                ← Client
│
├── hooks/
│   ├── useMessages.ts             ← Real-time messages
│   ├── useLiveKit.ts              ← Live audio
│   └── useAuth.ts
│
├── components/
│   ├── BlurProgressiveCard.tsx    ← J1/J2/J3 UI
│   ├── GlassCard.tsx
│   └── Wallet.tsx
│
└── app/(tabs)/
    ├── index.tsx                  ← Swipe avec blur
    ├── messages.tsx               ← Chat avec compteur
    ├── live.tsx                   ← Lives groupées
    └── profile.tsx                ← Profil + photo
```

---

## 🎉 Next Step

**Implémenter `messages.tsx` avec:**
1. Lister matches (avec statut + compteur)
2. Chat en temps réel avec `useMessages()`
3. Afficher progression déverrouillage
4. Tester le seuil: 6 messages → J2 déverrouille

**Puis déployer Edge Function pour automatiser.**

Prêt? 🚀
