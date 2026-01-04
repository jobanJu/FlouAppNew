# 🚀 FlouApp Deployment on Railway

Railway est la plateforme idéale pour déployer FlouApp en production. Elle offre:
- ✅ Auto-restart automatique
- ✅ Scaling automatique
- ✅ Variables d'environnement sécurisées
- ✅ Logs en temps réel
- ✅ Domain personnalisé
- ✅ SSL/TLS gratuit

## 📋 Prérequis

1. **Compte Railway** - https://railway.app
2. **GitHub connecté** (pour auto-deploy)
3. **Variables d'environnement** (Supabase, LiveKit)

## 🔧 Setup sur Railway

### Step 1: Créer un nouveau projet Railway
```bash
# Via CLI (optionnel)
npm install -g @railway/cli
railway login
railway init
```

Ou directement via dashboard: https://railway.app/dashboard

### Step 2: Connecter GitHub repository
1. Aller à https://railway.app/dashboard
2. Cliquer "New Project"
3. Choisir "Deploy from GitHub repo"
4. Connecter ton compte GitHub
5. Sélectionner `jobanJu/FlouAppNew`

### Step 3: Configurer les services

Railway détecte automatiquement:
- Node.js backend (`backend/package.json`)
- Frontend Expo (root `package.json`)

#### Service 1: Backend
```yaml
Name: flouapp-backend
Build: Dockerfile (backend/Dockerfile)
Start: npm start
Port: 3001
```

#### Service 2: Frontend
```yaml
Name: flouapp-frontend
Build: Dockerfile (Dockerfile.frontend)
Start: npm start
Port: 8081
```

### Step 4: Ajouter les variables d'environnement

Dans Railway Dashboard → Variables:

**Backend (.env):**
```env
NODE_ENV=production
PORT=3001
SUPABASE_URL=https://lyqtupcjevgxpovzevcz.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<ton_service_role_key>
LIVEKIT_URL=wss://flouapp-mejnaydh.livekit.cloud
LIVEKIT_API_KEY=APIJZ8kdXvHxS4j
LIVEKIT_API_SECRET=KyLjPsROTeXbd294yoLNhI2dXCUwOZTLcGLg73RiqCd
```

**Frontend (.env):**
```env
NODE_ENV=production
EXPO_PUBLIC_SUPABASE_URL=https://lyqtupcjevgxpovzevcz.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<ton_anon_key>
EXPO_PUBLIC_LIVEKIT_URL=wss://flouapp-mejnaydh.livekit.cloud
EXPO_PUBLIC_BACKEND_URL=https://flouapp-backend-<railway>.railway.app
```

⚠️ **Important**: Remplace `<railway>` par ton URL Railway réelle!

### Step 5: Déployer

```bash
git push origin main
```

Railway va:
1. ✅ Detecter les changements
2. ✅ Construire les images Docker
3. ✅ Déployer les services
4. ✅ Attribuer des URLs publiques

## 📊 Après Déploiement

### Vérifier le statut:
```bash
railway status
```

### Voir les logs:
```bash
railway logs --service flouapp-backend
railway logs --service flouapp-frontend
```

### URLs de production:
- **Backend**: `https://flouapp-backend-<id>.railway.app`
- **Frontend**: `https://flouapp-frontend-<id>.railway.app`
- **Vercel API**: `https://flouappnew.vercel.app`

### Test des endpoints:
```bash
# Test backend
curl https://flouapp-backend-<id>.railway.app/health

# Test token endpoint
curl -X POST https://flouapp-backend-<id>.railway.app/api/livekit/token \
  -H "Content-Type: application/json" \
  -d '{"roomName":"test","userName":"testuser"}'
```

## 🔄 CI/CD avec Railway

Railway supporte l'auto-deployment:
1. Tout push à `main` déclenche une build
2. Tests automatiques (optionnel)
3. Déploiement automatique si succès
4. Rollback automatique en cas d'erreur

**Configurer:**
```bash
railway env set DEPLOY_ON_PUSH=true
```

## 🆘 Troubleshooting

### Build échoue
```bash
# Voir les logs de build
railway logs --tail
```

### Services ne démarrent pas
- Vérifier les variables d'environnement
- Vérifier les Dockerfiles
- Augmenter la mémoire si nécessaire

### Port déjà utilisé
Railway gère cela automatiquement. Pas besoin de s'inquiéter.

### CORS errors
Vérifier `backend/index.js` - CORS est déjà configuré:
```javascript
app.use(cors());
```

## 💰 Coûts

Railway offre:
- **$5/mois** pour starters
- **Auto-scaling** inclus
- **256MB RAM** par défaut (augmentable)

## 🔐 Sécurité

✅ Variables d'environnement chiffrées
✅ HTTPS/SSL automatique
✅ Firewall inclus
✅ Monitoring 24/7

## 📱 Mise à jour de l'app

Pour mettre à jour en production:

```bash
# Sur ta machine locale
git commit -am "feat: new feature"
git push origin main

# Railway détecte automatiquement et redéploie!
```

---

**Questions?** Voir la doc Railway: https://docs.railway.app
