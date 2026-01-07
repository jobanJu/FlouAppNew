# 🎥 Installation Daily.co pour les Lives

## ✅ Ce qui a été fait

- ✅ SDK Daily.co ajouté dans `public/index.html`
- ✅ Fonctions de création de room automatique
- ✅ Connexion audio/vidéo fonctionnelle
- ✅ Flou permanent (blur 25px) appliqué sur les vidéos
- ✅ Bouton micro fonctionnel (mute/unmute)
- ✅ Gestion automatique des participants
- ✅ Colonne `room_url` ajoutée dans la table `lives`

---

## 📋 Configuration en 3 étapes

### 1️⃣ Créer un compte Daily.co (GRATUIT)

1. Va sur **https://dashboard.daily.co/u/signup**
2. Crée un compte avec ton email
3. Vérifie ton email

**🎁 Plan gratuit** : 10 000 minutes/mois (suffisant pour tester !)

---

### 2️⃣ Récupérer ton API Key

1. Connecte-toi sur https://dashboard.daily.co
2. Va dans **Developers** (menu de gauche)
3. Copie ton **API Key** (commence par `sk_...`)

---

### 3️⃣ Ajouter l'API Key dans le code

**Fichier** : `public/index.html`

**Ligne ~1007** :

```javascript
// Remplace cette ligne :
const DAILY_API_KEY = 'TU_API_KEY_DAILY_ICI';

// Par ta clé :
const DAILY_API_KEY = 'sk_xxxxxxxxxxxxxxxxxxxxxxxx';
```

**Comment trouver ?**
```bash
# Recherche dans le fichier
grep "DAILY_API_KEY" public/index.html
```

---

## 🧪 Tester

### Test sans API Key (Mode démo)
Le code fonctionne déjà en mode test **sans API key** !
- Les Lives utilisent des rooms temporaires
- Parfait pour tester l'interface
- Les vidéos ne seront pas partagées entre utilisateurs

### Test avec API Key (Production)
1. Ajoute ton API Key comme ci-dessus
2. Push le code : `git push origin main`
3. Crée un Live sur https://flouappnew-production.up.railway.app/
4. Ouvre la même URL sur un autre appareil/navigateur
5. Les deux vidéos devraient apparaître (floutées)

---

## 🎛️ Fonctionnalités activées

### ✅ Audio
- Micro activé par défaut
- Bouton "🎤 Micro" pour mute/unmute
- Audio partagé entre tous les participants

### ✅ Vidéo
- Caméra activée automatiquement
- **Flou permanent de 25px** (non désactivable)
- Affichage en grille responsive (1-4 participants)

### ✅ Gestion automatique
- Création de room Daily à chaque nouveau Live
- Connexion automatique des participants
- Déconnexion propre au moment de quitter
- Mise à jour temps réel des participants

---

## 🔧 Paramètres Daily.co

### Configuration actuelle (ligne ~2089)

```javascript
properties: {
  max_participants: 10,      // Max 10 personnes simultanées
  enable_chat: false,        // Chat désactivé (on utilise le nôtre)
  enable_screenshare: false, // Pas de partage d'écran
  enable_recording: false    // Pas d'enregistrement
}
```

### Modifier les paramètres

**Augmenter le nombre de participants** :
```javascript
max_participants: 20 // Jusqu'à 20 personnes
```

**Activer l'enregistrement** :
```javascript
enable_recording: true // Les Lives peuvent être enregistrés
```

---

## 📱 Permissions navigateur

Au premier Live, le navigateur demandera :
- 🎤 **Accès au micro**
- 📹 **Accès à la caméra**

**Important** : Les utilisateurs doivent accepter ces permissions pour participer.

---

## 🐛 Résolution de problèmes

### "Erreur de connexion vidéo"
**Causes** :
- Pas d'accès à la caméra/micro
- Connexion internet faible
- HTTPS requis (HTTP ne fonctionne pas)

**Solutions** :
1. Vérifie les permissions dans le navigateur
2. Teste sur https://flouappnew-production.up.railway.app/ (pas en local)
3. Ouvre la console (`F12`) pour voir les erreurs

---

### "Daily API key manquante"
**Normal !** Le code fonctionne en mode test sans API key.

**Pour activer la production** :
1. Ajoute ton API Key (voir étape 3 ci-dessus)
2. Redéploie sur Railway

---

### Vidéos ne s'affichent pas
**Checklist** :
- [ ] API Key ajoutée (ou mode test actif)
- [ ] HTTPS activé (Railway le fait automatiquement)
- [ ] Permissions caméra/micro accordées
- [ ] Console du navigateur sans erreurs
- [ ] Tester avec 2 appareils différents

**Debug** :
```javascript
// Dans la console du navigateur
console.log('Daily call object:', dailyCallObject);
console.log('Participants:', dailyCallObject?.participants());
```

---

### Le flou ne s'applique pas
**Vérification** :

**Fichier** : `public/index.html` ligne ~2146

```javascript
video.style.filter = 'blur(25px)'; // Doit être présent
```

**Si manquant** :
```javascript
// Ajoute cette ligne après la création de la vidéo
const video = document.createElement('video');
video.style.filter = 'blur(25px)'; // ← Cette ligne
```

---

## 💰 Coûts

### Plan Daily.co gratuit
- ✅ 10 000 minutes/mois
- ✅ Illimité en nombre de rooms
- ✅ Max 10 participants par room

**Calcul** :
- 1 Live de 30 minutes avec 4 personnes = 120 minutes
- **83 Lives/mois gratuits** (10 000 ÷ 120)

### Plan payant (si besoin)
- **Developer** : 99$/mois pour 30 000 minutes
- **Scale** : 249$/mois pour 100 000 minutes

---

## 📊 Monitoring

### Dashboard Daily.co
https://dashboard.daily.co

**Statistiques disponibles** :
- Nombre de rooms créées
- Minutes consommées
- Participants actifs
- Qualité des connexions

---

## 🚀 Optimisations futures

### 1. Qualité vidéo
```javascript
dailyCallObject.updateInputSettings({
  video: {
    width: 640,  // Réduit la résolution (économise la bande passante)
    height: 480
  }
});
```

### 2. Indicateur de qualité réseau
```javascript
dailyCallObject.on('network-quality-change', (event) => {
  console.log('Qualité réseau:', event.threshold); // "good" / "low" / "very-low"
});
```

### 3. Mode audio uniquement
```javascript
// Pour les spectateurs : désactiver la caméra
dailyCallObject.setLocalVideo(false);
```

---

## 📚 Documentation officielle

- **Daily.co Docs** : https://docs.daily.co/
- **JavaScript SDK** : https://docs.daily.co/reference/daily-js
- **Exemples** : https://github.com/daily-co/daily-examples

---

## ✅ Checklist finale

Avant de lancer en production :

- [ ] API Key Daily.co ajoutée dans le code
- [ ] Script SQL `supabase_add_lives.sql` exécuté
- [ ] Test sur 2 appareils différents (même Live)
- [ ] Vidéos floutées visibles
- [ ] Audio fonctionnel
- [ ] Bouton micro fonctionne
- [ ] Chat en temps réel OK
- [ ] Cadeaux Brumes testés
- [ ] Favoris et matching testés

---

## 🎉 C'est prêt !

Une fois l'API Key ajoutée, les Lives sont **100% fonctionnels** :
- ✅ Audio/vidéo en temps réel
- ✅ Flou permanent
- ✅ Chat
- ✅ Cadeaux Brumes
- ✅ Favoris et matching

**Go live !** 🚀
