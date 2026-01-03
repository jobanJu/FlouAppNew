# 🔐 Variables d'Environnement FlouAppNew

## Où les ajouter ?

### 🚀 Sur Railway
1. Ouvrir le projet Railway
2. Variables → Add Variable
3. Copier/coller chaque variable ci-dessous

### 🟦 Sur Heroku
```bash
heroku config:set VAR_NAME=value
```

### 🖥️ Localement (.env)
Créer un fichier `.env` à la racine du projet

---

## 📋 Variables Requises

### 1️⃣ Supabase (Base de données)
```env
EXPO_PUBLIC_SUPABASE_URL=https://lyqtupcjevgxpovzevcz.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5cXR1cGNqZXZneHBvdnpldmN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyMTUwNzAsImV4cCI6MjA4MTc5MTA3MH0.pN4bjcbxHSLIkOFwyZuGwEiZ5vYVNC-SS9RqTTle3bk
```

**Description:**
- `EXPO_PUBLIC_SUPABASE_URL` - URL de ton serveur Supabase
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Clé anonyme Supabase (publique, c'est OK)

---

### 2️⃣ LiveKit (Vidéo/Audio)
```env
LIVEKIT_URL=wss://flouapp-mejnaydh.livekit.cloud
LIVEKIT_API_KEY=APIJZ8kdXvHxS4j
LIVEKIT_API_SECRET=KyLjPsROTeXbd294yoLNhI2dXCUwOZTLcGLg73RiqCd
```

**Description:**
- `LIVEKIT_URL` - URL WebSocket du serveur LiveKit
- `LIVEKIT_API_KEY` - Clé API LiveKit
- `LIVEKIT_API_SECRET` - Secret API LiveKit (confidentiel ⚠️)

---

### 3️⃣ Environnement
```env
NODE_ENV=production
```

**Description:**
- `NODE_ENV` - Mode d'exécution (production/development)

---

## 📊 Tableau Récapitulatif

| Variable | Valeur | Type | Requise |
|----------|--------|------|---------|
| `EXPO_PUBLIC_SUPABASE_URL` | `https://lyqtupcjevgxpovzevcz.supabase.co` | String | ✅ OUI |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGci...` | String | ✅ OUI |
| `LIVEKIT_URL` | `wss://flouapp-mejnaydh.livekit.cloud` | String | ✅ OUI |
| `LIVEKIT_API_KEY` | `APIJZ8kdXvHxS4j` | String | ✅ OUI |
| `LIVEKIT_API_SECRET` | `KyLjPsROTeXbd294yoLNhI2dXCUwOZTLcGLg73RiqCd` | String | ✅ OUI |
| `NODE_ENV` | `production` | String | ✅ OUI |

---

## 🚀 Sur Railway (Étapes Complètes)

### 1. Ouvrir Railway
- Aller sur https://railway.app
- Cliquer sur ton projet FlouAppNew

### 2. Variables
```
Click "Variables" (en haut)
↓
Click "Add Variable"
```

### 3. Ajouter chaque variable
```
Clé:    EXPO_PUBLIC_SUPABASE_URL
Valeur: https://lyqtupcjevgxpovzevcz.supabase.co
Click "Add"

Clé:    EXPO_PUBLIC_SUPABASE_ANON_KEY
Valeur: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5cXR1cGNqZXZneHBvdnpldmN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyMTUwNzAsImV4cCI6MjA4MTc5MTA3MH0.pN4bjcbxHSLIkOFwyZuGwEiZ5vYVNC-SS9RqTTle3bk
Click "Add"

Clé:    LIVEKIT_URL
Valeur: wss://flouapp-mejnaydh.livekit.cloud
Click "Add"

Clé:    LIVEKIT_API_KEY
Valeur: APIJZ8kdXvHxS4j
Click "Add"

Clé:    LIVEKIT_API_SECRET
Valeur: KyLjPsROTeXbd294yoLNhI2dXCUwOZTLcGLg73RiqCd
Click "Add"

Clé:    NODE_ENV
Valeur: production
Click "Add"
```

### 4. Redéployer
```
Click "Deployments"
Click "Latest Deployment"
Click "Rerun"
```

---

## 📝 Fichier .env (Local)

Si tu veux tester localement, crée `.env` à la racine :

```bash
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://lyqtupcjevgxpovzevcz.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5cXR1cGNqZXZneHBvdnpldmN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyMTUwNzAsImV4cCI6MjA4MTc5MTA3MH0.pN4bjcbxHSLIkOFwyZuGwEiZ5vYVNC-SS9RqTTle3bk

# LiveKit
LIVEKIT_URL=wss://flouapp-mejnaydh.livekit.cloud
LIVEKIT_API_KEY=APIJZ8kdXvHxS4j
LIVEKIT_API_SECRET=KyLjPsROTeXbd294yoLNhI2dXCUwOZTLcGLg73RiqCd

# Environnement
NODE_ENV=production
```

Puis lancer : `npm start`

---

## ⚠️ Sécurité

### ✅ Ce qui est PUBLIC (Safe)
- `EXPO_PUBLIC_SUPABASE_URL` - L'URL du serveur
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Clé anonyme (scope limité)
- `LIVEKIT_URL` - L'URL du serveur

### 🔒 Ce qui est CONFIDENTIEL (Keep Secret)
- `LIVEKIT_API_SECRET` - ⚠️ À protéger absolument
- `.env` - Ne pas commit sur GitHub

### Git
```bash
# Ajouter à .gitignore (s'il n'y est pas)
echo ".env" >> .gitignore
echo ".env.production" >> .gitignore
echo ".env.local" >> .gitignore

git add .gitignore
git commit -m "Add env files to gitignore"
git push
```

---

## ✅ Checklist

- [ ] Variable `EXPO_PUBLIC_SUPABASE_URL` ajoutée
- [ ] Variable `EXPO_PUBLIC_SUPABASE_ANON_KEY` ajoutée
- [ ] Variable `LIVEKIT_URL` ajoutée
- [ ] Variable `LIVEKIT_API_KEY` ajoutée
- [ ] Variable `LIVEKIT_API_SECRET` ajoutée
- [ ] Variable `NODE_ENV` ajoutée
- [ ] Redéploiement effectué
- [ ] App teste et fonctionne ✅

---

## 🆘 En cas de problème

### Erreur "Cannot find Supabase"
→ Vérifier `EXPO_PUBLIC_SUPABASE_URL` et `EXPO_PUBLIC_SUPABASE_ANON_KEY`

### Erreur "LiveKit connection failed"
→ Vérifier `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`

### Variables non chargées
→ Redéployer après ajout des variables
→ Attendre ~30 secondes le redéploiement

---

**C'est tout ce dont tu as besoin ! 🎉**

