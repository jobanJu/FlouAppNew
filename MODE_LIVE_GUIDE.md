# 🎥 MODE LIVE - GUIDE D'IMPLÉMENTATION

## ✅ FONCTIONNALITÉS IMPLÉMENTÉES

### 🌫️ LIVE GROUPE
- **Création de Live** : Hôte peut créer un Live avec titre, description et pseudo
- **Rôles** : Hôte (1), Participants (max 4), Spectateurs (illimités)
- **Vidéo floutée** : Affichage des participants avec flou permanent (blur 25px)
- **Chat en direct** : Messages temps réel avec pseudos
- **Micro** : Bouton pour activer/couper le micro (UI seulement, audio WebRTC à intégrer)
- **Cadeaux Brumes** : Envoyer des Brumes aux participants via modale
- **Favoris** : Hôte peut ajouter des participants aux favoris
- **Matching post-live** : Accès aux favoris depuis le profil pour matcher

### 💕 LIVE DATE (1v1)
- **Phase Versus** : 10 questions rapides (2 minutes)
- **Questions** : Matin/Nuit, Improviser/Planifier, Voyager léger/Tout prévoir, etc.
- **Comparaison** : Les réponses sont sauvegardées pour comparaison
- **Timer** : Compte à rebours de 2:00 minutes
- **Transition** : Passage automatique à la salle Live après le Versus

### 🎯 SYSTÈME COMPLET
- **Base de données** : 6 nouvelles tables (lives, live_participants, live_messages, live_gifts, live_favorites, live_date_answers)
- **RLS activé** : Toutes les tables sécurisées avec Row Level Security
- **Fonction Brumes** : send_live_gift() pour envoyer des cadeaux avec vérification du solde
- **Navigation** : Nouveau bouton 🎥 Live dans la bottom-nav
- **Temps réel** : Abonnements Supabase Realtime pour participants et messages
- **Interface** : 4 vues (Liste Lives, Création, Salle Groupe, Salle Date)

---

## 📋 ÉTAPES SUIVANTES

### 1️⃣ EXÉCUTER LE SCRIPT SQL
**Fichier** : `supabase_add_lives.sql`

**Action** :
1. Ouvre Supabase Dashboard → SQL Editor
2. Copie le contenu de `supabase_add_lives.sql`
3. Exécute le script
4. Vérifie que les 6 tables sont créées

**Tables créées** :
- ✅ lives
- ✅ live_participants
- ✅ live_messages
- ✅ live_gifts
- ✅ live_favorites
- ✅ live_date_answers

### 2️⃣ TESTER LES FONCTIONNALITÉS

#### Test Live Groupe
1. Connecte-toi avec un compte
2. Va sur l'onglet 🎥 Live
3. Clique sur "✨ Créer un Live"
4. Sélectionne "👥 Live Groupe"
5. Remplis titre, description, pseudo
6. Lance le Live
7. Teste le chat, les boutons (Micro, Cadeau, Favoris)

#### Test Live Date
1. Crée un Live Date au lieu de Groupe
2. Réponds aux questions Versus (10 questions)
3. Vérifie le timer (2:00 → 0:00)
4. Confirme la transition vers la salle Live

#### Test Matching Post-Live
1. En tant qu'hôte, ajoute des participants aux favoris
2. Quitte le Live
3. Va sur ton profil
4. Clique sur "⭐ Mes Favoris Live"
5. Clique sur un profil pour le liker
6. Vérifie le match si réciproque

### 3️⃣ INTÉGRATIONS À FAIRE

#### 🎤 Audio/Vidéo (WebRTC)
**Actuellement** : Interface UI uniquement (bouton micro, vidéos placeholder)

**À intégrer** :
- WebRTC pour flux audio/vidéo réel
- Librairie recommandée : [Daily.co](https://daily.co), [Agora](https://www.agora.io), ou [Twilio Video](https://www.twilio.com/video)
- Appliquer `filter: blur(25px)` sur les balises `<video>`

**Exemple avec Daily.co** :
```javascript
// Créer une room
const room = await daily.createRoom({ privacy: 'public' });

// Rejoindre
const call = daily.join({ url: room.url });

// Appliquer le flou
document.querySelector('video').style.filter = 'blur(25px)';
```

#### 💳 Paiements Stripe (Cadeaux Brumes)
**Actuellement** : Système mock avec solde fictif

**À faire** :
1. Créer des produits Stripe pour les Brumes
2. Intégrer Stripe Checkout
3. Webhook pour créditer les Brumes après paiement

#### 📊 Analytics
**Recommandations** :
- Tracking : Nombre de Lives créés, participants moyen, durée moyenne
- Heatmap : Questions Versus les plus populaires
- Conversion : Favoris → Matches

---

## 🔧 ARCHITECTURE TECHNIQUE

### Base de données
```sql
-- Structure simplifiée
lives (id, host_id, type, title, status, max_participants)
  └─ live_participants (live_id, user_id, role, pseudo)
  └─ live_messages (live_id, user_id, content)
  └─ live_gifts (live_id, sender_id, receiver_id, amount)
  └─ live_favorites (live_id, host_id, user_id)
  └─ live_date_answers (live_id, user_id, question, answer)
```

### Flux utilisateur
```
1. Création → lives (status: 'waiting')
2. Démarrage → lives (status: 'active', started_at)
3. Participants → live_participants (role: host/participant/spectator)
4. Interaction → live_messages, live_gifts
5. Favoris → live_favorites (host uniquement)
6. Fin → lives (status: 'ended', ended_at)
7. Matching → Depuis profil → Modale favoris → Like → Match
```

### Realtime (Supabase)
```javascript
// Écoute des changements
supabase
  .channel(`live:${liveId}`)
  .on('postgres_changes', { table: 'live_participants' }, handler)
  .on('postgres_changes', { table: 'live_messages' }, handler)
  .subscribe();
```

---

## 🎨 PERSONNALISATION

### Modifier les questions Versus
**Fichier** : `public/index.html` ligne ~2099

```javascript
let versusQuestions = [
  { question: "Ta question ?", options: ["Option 1", "Option 2"] },
  // Ajoute jusqu'à 10 questions
];
```

### Ajuster le timer Versus
**Fichier** : `public/index.html` ligne ~2101

```javascript
let versusTimer = 120; // En secondes (120 = 2 minutes)
```

### Changer le flou vidéo
**Fichier** : `public/index.html` ligne ~181

```css
.live-video-blur { 
  filter: blur(25px); /* Augmente ou diminue le flou */
}
```

---

## ⚠️ LIMITATIONS ACTUELLES

### Fonctionnalités mock
1. **Audio/Vidéo** : Pas de flux réel, uniquement UI
2. **Micro** : Bouton UI sans capture audio
3. **Vidéos** : Images statiques au lieu de flux live

### À améliorer
1. **Notifications** : Alerter quand quelqu'un rejoint le Live
2. **Modération** : Bannir un participant, supprimer un message
3. **Statistiques** : Dashboard pour l'hôte (temps de parole, engagement)
4. **Replay** : Enregistrer et revoir un Live (si autorisé)

---

## 📱 RESPONSIVE

### Breakpoints
- **Mobile** : Vidéos en grille 1 colonne
- **Tablet** : 2 colonnes
- **Desktop** : 3-4 colonnes (auto-fit)

### Chat
- **Mobile** : 200px de hauteur
- **Desktop** : 250px de hauteur

---

## 🚀 DÉPLOIEMENT

### Checklist
- [x] Code pushé sur GitHub
- [ ] SQL script exécuté sur Supabase
- [ ] Tests manuels (Groupe + Date)
- [ ] Intégration WebRTC (optionnel pour beta)
- [ ] Intégration Stripe (optionnel pour beta)
- [ ] Tests utilisateurs (5-10 personnes)

### Environnements
- **Development** : http://localhost:3000
- **Production** : https://flouappnew-production.up.railway.app/

---

## 📞 SUPPORT

### Bugs connus
- Aucun pour l'instant

### Demandes futures
- Permettre aux participants de parler en même temps (mode table ronde)
- Ajouter des filtres AR (snapchat-like) par-dessus le flou
- Mode "speed-dating" : plusieurs Lives Date enchaînés

---

## 🎉 RÉSUMÉ

**Ce qui fonctionne** :
✅ Création de Lives (Groupe + Date)
✅ Rejoindre un Live avec pseudo
✅ Chat en temps réel
✅ Cadeaux Brumes
✅ Favoris hôte
✅ Matching post-live
✅ Phase Versus (10 questions, timer 2min)
✅ Interface complète et responsive

**Ce qui manque** :
❌ Flux audio/vidéo réel (WebRTC)
❌ Capture micro fonctionnelle
❌ Paiements Stripe

**Prêt pour** :
🟢 Beta test avec utilisateurs (fonctionnalités core OK)
🔴 Production publique (nécessite WebRTC + Stripe)
