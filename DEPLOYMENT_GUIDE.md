# 🚀 FlouAppNew - Guide de Déploiement en Production

## 📋 Table des matières
1. [Docker Compose (Recommandé)](#docker-compose)
2. [PM2 (Node.js)](#pm2)
3. [Systemd (Linux)](#systemd)
4. [Configuration serveur](#serveur)

---

## 🐳 Docker Compose (Recommandé)

### Prérequis
- Docker (≥ 20.10)
- Docker Compose (≥ 2.0)

### Installation

```bash
# 1. Cloner le repo
git clone https://github.com/jobanJu/FlouAppNew.git
cd FlouAppNew

# 2. Démarrer les services
npm run start:docker

# 3. Consulter les logs
npm run logs:docker

# 4. Arrêter les services
npm run stop:docker
```

### Vérifier le statut

```bash
docker ps
docker-compose ps

# Health check
curl http://localhost/health
```

### Architecture Docker

```
┌─────────────────────────────────────┐
│        Client                       │
└────────────────┬────────────────────┘
                 │ HTTP/HTTPS
┌────────────────▼────────────────────┐
│   Nginx Reverse Proxy (Port 80/443) │
│  - Load balancing                   │
│  - SSL/TLS termination              │
│  - Rate limiting                    │
│  - Gzip compression                 │
└────────────────┬────────────────────┘
                 │ Internal Network
┌────────────────▼────────────────────┐
│   FlouAppNew Expo Server (8081)     │
│  - Expo CLI server                  │
│  - Hot module reloading             │
│  - Bundle serving                   │
└─────────────────────────────────────┘
```

---

## 📦 PM2 (Process Manager for Node.js)

### Installation

```bash
# Installer PM2 globalement
npm install -g pm2

# Démarrer l'app avec PM2
pm2 start ecosystem.config.js

# Vérifier le statut
pm2 status

# Afficher les logs
pm2 logs flouapp

# Arrêter l'app
pm2 stop flouapp

# Redémarrer
pm2 restart flouapp

# Supprimer du gestionnaire
pm2 delete flouapp
```

### Sauvegarde de la configuration PM2

```bash
# Sauvegarder la configuration des apps PM2
pm2 save

# Permettre à PM2 de redémarrer au boot
pm2 startup

# Désactiver au boot
pm2 unstartup
```

### Monitorer les ressources

```bash
# Dashboard en temps réel
pm2 monit

# Web dashboard
pm2 web
# Accéder à: http://localhost:9615
```

---

## 🐧 Systemd (Linux)

### Installation

```bash
# 1. Copier le service
sudo cp flouapp.service /etc/systemd/system/

# 2. Recharger systemd
sudo systemctl daemon-reload

# 3. Activer au démarrage
sudo systemctl enable flouapp

# 4. Démarrer le service
sudo systemctl start flouapp

# 5. Vérifier le statut
sudo systemctl status flouapp

# 6. Afficher les logs
sudo journalctl -u flouapp -f
```

### Commandes utiles

```bash
# Arrêter le service
sudo systemctl stop flouapp

# Redémarrer
sudo systemctl restart flouapp

# Désactiver au démarrage
sudo systemctl disable flouapp

# Voir les logs détaillés
sudo journalctl -u flouapp --since today

# Vérifier la configuration
systemd-analyze verify flouapp.service
```

---

## 🖥️ Configuration Serveur

### Prérequis systèmes

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y \
    curl \
    git \
    nodejs \
    npm \
    docker.io \
    docker-compose

# RHEL/CentOS
sudo yum install -y \
    curl \
    git \
    nodejs \
    npm \
    docker \
    docker-compose
```

### Préparation du serveur

```bash
# Créer un utilisateur pour l'application
sudo useradd -m -s /bin/bash flouapp

# Donner les permissions Docker
sudo usermod -aG docker flouapp

# Créer les répertoires
mkdir -p /var/www/flouapp
mkdir -p /var/log/flouapp
mkdir -p /var/lib/flouapp

# Cloner le repo
cd /var/www/flouapp
git clone https://github.com/jobanJu/FlouAppNew.git .
```

### Configuration Nginx (optionnel)

```bash
# Créer un vhost Nginx
sudo nano /etc/nginx/sites-available/flouapp

# Contenu:
server {
    listen 80;
    server_name flouapp.yourdomain.com;

    location / {
        proxy_pass http://localhost:8081;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Activer le site
sudo ln -s /etc/nginx/sites-available/flouapp /etc/nginx/sites-enabled/

# Tester la configuration
sudo nginx -t

# Redémarrer Nginx
sudo systemctl restart nginx
```

### SSL/TLS avec Let's Encrypt

```bash
# Installer Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Obtenir un certificat
sudo certbot certonly --nginx -d flouapp.yourdomain.com

# Auto-renouvellement
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

---

## 📊 Surveillance et Logs

### Logs Docker

```bash
# Logs en direct
docker-compose logs -f

# Logs d'une app spécifique
docker-compose logs -f flouapp

# Nombre de logs
docker-compose logs --tail=100
```

### Logs PM2

```bash
# Logs en direct
pm2 logs

# Logs d'une app
pm2 logs flouapp

# Logs des erreurs
pm2 logs flouapp --err
```

### Logs Systemd

```bash
# Logs en direct
sudo journalctl -u flouapp -f

# Depuis aujourd'hui
sudo journalctl -u flouapp --since today

# Dernières 100 lignes
sudo journalctl -u flouapp -n 100
```

---

## 🔐 Sécurité

### Variables d'environnement

```bash
# Ne PAS commit les secrets dans git
echo ".env.production" >> .gitignore

# Créer .env.production
cp .env .env.production

# Éditer avec les vraies clés
nano .env.production

# Charger au démarrage
export $(cat .env.production | xargs)
npm start
```

### Firewall

```bash
# UFW (Ubuntu)
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 8081/tcp  # Expo Dev Server (interne)

# Firewalld (CentOS/RHEL)
sudo firewall-cmd --permanent --add-port=22/tcp
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --reload
```

---

## 🆘 Dépannage

### L'app ne démarre pas

```bash
# Vérifier les logs
docker-compose logs flouapp
# ou
pm2 logs flouapp
# ou
sudo journalctl -u flouapp -f

# Vérifier les ports
sudo lsof -i :8081
netstat -tulpn | grep 8081

# Vérifier les dépendances
npm list --depth=0
```

### Problèmes de mémoire

```bash
# Docker: augmenter la limite
# Dans docker-compose.yml:
# deploy:
#   resources:
#     limits:
#       memory: 2G

# PM2: définir la limite
pm2 start app.js --max-memory-restart 1G
```

### Redémarrages fréquents

```bash
# Vérifier les crashs
docker stats flouapp
pm2 monit

# Augmenter le timeout
# ecosystem.config.js:
# listen_timeout: 30000
# kill_timeout: 10000
```

---

## 📈 Performance

### Optimisations recommandées

1. **Gzip Compression** (configuré dans nginx.conf)
2. **Rate Limiting** (configuré dans nginx.conf)
3. **Caching HTTP** (headers dans nginx)
4. **Connection Pooling** (Supabase)
5. **Memory Limits** (PM2/Docker)

### Monitoring

```bash
# Prometheus pour métriques
docker pull prom/prometheus

# Grafana pour visualisation
docker pull grafana/grafana

# Health check
curl http://localhost/health
```

---

## �� Checklist Déploiement

- [ ] Vérifier les variables d'environnement
- [ ] Tester localement avec `npm start`
- [ ] Tester Docker avec `npm run start:docker`
- [ ] Configurer le firewall
- [ ] Configurer SSL/TLS
- [ ] Configurer la sauvegarde
- [ ] Configurer la surveillance
- [ ] Documenter les accès
- [ ] Tester la restauration

---

## 📞 Support

Pour plus d'aide:
- GitHub Issues: https://github.com/jobanJu/FlouAppNew/issues
- Documentation Expo: https://docs.expo.dev
- Documentation Docker: https://docs.docker.com
- Documentation PM2: https://pm2.keymetrics.io

---

*Guide généré: 2025-01-03*
*Version: 1.0*
