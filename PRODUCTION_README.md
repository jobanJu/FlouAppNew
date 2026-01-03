# 🚀 FlouAppNew - Configuration Production en Continu

## Statut
✅ **L'application est configurée pour fonctionner en continu sur un serveur**

## Fichiers de Configuration Créés

### 🐳 Docker
- **Dockerfile** - Image Docker multi-stage pour production
- **docker-compose.yml** - Orchestration des services (Expo + Nginx)
- **nginx.conf** - Configuration Nginx (reverse proxy, rate limiting, compression)
- **.dockerignore** - Exclusions pour Docker build

### 📦 Node.js / Process Management
- **server.js** - Script Node.js standalone avec restart automatique
- **ecosystem.config.js** - Configuration PM2 pour process management
- **flouapp.service** - Service Systemd pour Linux

### 📚 Documentation
- **QUICK_START.md** - Guide de démarrage rapide (⭐ LIRE D'ABORD)
- **DEPLOYMENT_GUIDE.md** - Guide de déploiement complet et détaillé
- **PRODUCTION_README.md** - Ce fichier

## 3 Options de Déploiement

### Option 1️⃣ - Docker Compose (Recommandé - Plus facile)
```bash
npm run start:docker        # Démarrer
npm run logs:docker         # Voir les logs
npm run stop:docker         # Arrêter
npm run restart:docker      # Redémarrer
```

**Avantages:**
- ✅ Configuration complète incluse
- ✅ Nginx intégré (reverse proxy, SSL-ready)
- ✅ Hot reload pour développement
- ✅ Logs centralisés
- ✅ Health check automatique

**Prérequis:**
- Docker & Docker Compose

---

### Option 2️⃣ - PM2 (Process Manager pour Node.js)
```bash
npm install -g pm2
pm2 start ecosystem.config.js   # Démarrer
pm2 status                       # Voir le statut
pm2 logs flouapp                 # Voir les logs
pm2 restart flouapp              # Redémarrer
pm2 startup                      # Auto-restart au boot
```

**Avantages:**
- ✅ Léger et simple
- ✅ Gestion automatique des crashes
- ✅ Web dashboard disponible
- ✅ Monitoring en temps réel

**Prérequis:**
- Node.js 16+
- npm

---

### Option 3️⃣ - Systemd (Linux natif)
```bash
sudo cp flouapp.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable flouapp        # Auto-start au boot
sudo systemctl start flouapp         # Démarrer
sudo systemctl status flouapp        # Voir le statut
sudo journalctl -u flouapp -f        # Voir les logs
```

**Avantages:**
- ✅ Intégration native Linux
- ✅ Zéro dépendances externes
- ✅ Gestion système complète

**Prérequis:**
- Linux (Debian/Ubuntu/RHEL/CentOS)

---

## Caractéristiques de Production

### Auto-Restart
- ✅ Redémarrage automatique après crash
- ✅ Limitation du nombre de redémarrages
- ✅ Délai entre les redémarrages

### Logging
- ✅ Logs en fichier (`/logs/`)
- ✅ Rotation des logs
- ✅ Timestamps pour chaque entrée
- ✅ Distinction erreurs/logs normaux

### Performance
- ✅ Gzip compression (nginx)
- ✅ Rate limiting (nginx)
- ✅ Caching HTTP headers
- ✅ Connection pooling

### Sécurité
- ✅ Variables d'environnement sécurisées
- ✅ Support SSL/TLS (certificats Let's Encrypt)
- ✅ Firewall recommendations
- ✅ Health check endpoint

### Monitoring
- ✅ Health check configuré
- ✅ Endpoint `/health` disponible
- ✅ Logs détaillés
- ✅ Métriques de ressources

---

## Configuration pour Serveur Production

### 1. Préparation du Serveur

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y curl git nodejs npm docker.io docker-compose

# RHEL/CentOS
sudo yum install -y curl git nodejs npm docker docker-compose

# Donner les permissions Docker
sudo usermod -aG docker $USER
newgrp docker
```

### 2. Cloner et Configurer

```bash
cd /var/www
git clone https://github.com/jobanJu/FlouAppNew.git flouapp
cd flouapp

# Copier les variables d'environnement
cp .env .env.production

# Éditer avec tes vraies clés
nano .env.production
```

### 3. Démarrer l'Application

**Avec Docker (Recommandé):**
```bash
npm run start:docker
```

**Ou avec PM2:**
```bash
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
```

---

## Variables d'Environnement

Ajoute à `.env.production`:

```env
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://lyqtupcjevgxpovzevcz.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=...

# LiveKit
LIVEKIT_URL=wss://flouapp-mejnaydh.livekit.cloud
LIVEKIT_API_KEY=...
LIVEKIT_API_SECRET=...

# Production
NODE_ENV=production
```

---

## Ports Exposés

| Port | Service | Usage |
|------|---------|-------|
| **80** | Nginx | HTTP Traffic (public) |
| **443** | Nginx | HTTPS Traffic (public, SSL-ready) |
| **8081** | Expo | Dev Server (interne Docker) |
| **9615** | PM2 | Web Dashboard (optionnel) |

---

## Vérifier que tout fonctionne

```bash
# Health check
curl http://localhost/health

# Voir les processus
docker ps                          # Docker
pm2 status                         # PM2
sudo systemctl status flouapp      # Systemd

# Voir les logs
npm run logs:docker                # Docker
pm2 logs flouapp                   # PM2
sudo journalctl -u flouapp -f      # Systemd

# Accéder à l'app
# Navigateur: http://localhost (ou http://your-domain.com)
# Expo Dev: http://localhost:8081 (interne)
```

---

## Dépannage Rapide

### Port déjà utilisé?
```bash
lsof -i :80
lsof -i :8081
kill -9 <PID>
```

### Erreur de permission Docker?
```bash
sudo usermod -aG docker $USER
newgrp docker
```

### Vérifier que tout est configuré
```bash
# Les fichiers requis sont présents
ls -la Dockerfile docker-compose.yml ecosystem.config.js flouapp.service

# Les scripts npm sont configurés
grep "start:docker\|start:server" package.json
```

### Consulter les logs détaillés
```bash
# Docker
docker logs flouapp

# PM2
pm2 logs flouapp --err

# Systemd
sudo journalctl -u flouapp -n 100
```

---

## Domaine et SSL

### Configurer un domaine

```bash
# 1. Pointer ton domaine vers l'IP du serveur (DNS)
# 2. Attendre la propagation DNS (5-30 min)
# 3. Tester: curl http://your-domain.com
```

### Ajouter SSL avec Let's Encrypt

```bash
# Installer Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Obtenir un certificat
sudo certbot certonly --standalone -d your-domain.com

# Le certificat est dans /etc/letsencrypt/live/your-domain.com/
# À utiliser dans la config Nginx
```

---

## Maintenance

### Mises à jour du code

```bash
# Avec Docker
git pull origin main
npm run restart:docker

# Avec PM2
git pull origin main
pm2 restart flouapp

# Avec Systemd
git pull origin main
sudo systemctl restart flouapp
```

### Nettoyage des logs

```bash
# Docker
docker system prune -a

# PM2
pm2 flush

# Fichiers
rm -rf logs/*.log
```

---

## Performance Estimée

- **Temps de démarrage**: ~10-15 secondes
- **Consommation mémoire**: ~300-500 MB (en idle)
- **Requêtes/sec**: 100+ (avec rate limiting)
- **Latence moyenne**: <100ms (local), <500ms (réseau)

---

## Support et Documentation

- 📖 **QUICK_START.md** - Démarrage rapide
- 📖 **DEPLOYMENT_GUIDE.md** - Guide complet
- 🔗 [Expo Docs](https://docs.expo.dev)
- 🔗 [Docker Docs](https://docs.docker.com)
- 🔗 [PM2 Docs](https://pm2.keymetrics.io)
- 🔗 [Nginx Docs](https://nginx.org)

---

## Checklist Déploiement

- [ ] Serveur préparé (Node.js, Docker, npm)
- [ ] Code cloné et configuré
- [ ] Variables d'environnement définies
- [ ] App testée localement (`npm start`)
- [ ] Docker/PM2 installé et configuré
- [ ] App lancée en production
- [ ] Health check OK (`curl /health`)
- [ ] Logs consultés et OK
- [ ] Domaine configuré (optionnel)
- [ ] SSL configuré (optionnel)
- [ ] Monitoring en place
- [ ] Sauvegardes configurées

---

## 🎯 Résumé

**FlouAppNew est maintenant configurée pour:**
1. ✅ Fonctionner **24/7 en continu**
2. ✅ Redémarrer **automatiquement** après crash
3. ✅ Servir l'app via **Nginx** (reverse proxy)
4. ✅ Logger tous les **événements**
5. ✅ Supporter **SSL/TLS**
6. ✅ Limiter le **taux de requêtes**
7. ✅ Compresser les **réponses**
8. ✅ Monitorer la **santé**

**Tu as 3 options pour démarrer:**
- 🐳 Docker (Plus facile)
- 📦 PM2 (Plus léger)
- 🐧 Systemd (Plus natif)

**Choisis l'option qui correspond le mieux à ton infrastructure et lis QUICK_START.md pour les détails !**

---

*Dernière mise à jour: 2025-01-03*
*Version: 1.0*
