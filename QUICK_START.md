# ⚡ FlouAppNew - Démarrage Rapide en Production

## 🚀 Option 1: Docker Compose (RECOMMANDÉ - Plus simple)

```bash
# Démarrer l'app
npm run start:docker

# Vérifier que tout fonctionne
curl http://localhost/health

# Arrêter quand tu veux
npm run stop:docker
```

**C'est tout !** L'app tourne sur:
- 🌐 **Web**: http://localhost (port 80)
- 📱 **Expo Dev**: http://localhost:8081 (interne)

---

## 📦 Option 2: PM2 (Process Manager)

### Installation (une seule fois)

```bash
npm install -g pm2
```

### Démarrer l'app

```bash
# Lancer l'app
pm2 start ecosystem.config.js

# Vérifier que ça tourne
pm2 status

# Voir les logs
pm2 logs flouapp
```

### Arrêter/Redémarrer

```bash
pm2 stop flouapp
pm2 restart flouapp
pm2 delete flouapp
```

---

## 🐧 Option 3: Systemd (Linux natif)

### Installation (une seule fois)

```bash
sudo cp flouapp.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable flouapp
```

### Démarrer

```bash
sudo systemctl start flouapp

# Vérifier le statut
sudo systemctl status flouapp

# Voir les logs
sudo journalctl -u flouapp -f
```

---

## 🔍 Vérifier que ça fonctionne

```bash
# Test rapide
curl http://localhost/health

# Voir les logs
npm run logs:docker        # Docker
pm2 logs flouapp           # PM2
sudo journalctl -u flouapp # Systemd
```

## ✅ Commandes Essentielles

| Action | Commande |
|--------|----------|
| **Démarrer** | `npm run start:docker` |
| **Arrêter** | `npm run stop:docker` |
| **Redémarrer** | `npm run restart:docker` |
| **Voir logs** | `npm run logs:docker` |
| **Status** | `docker-compose ps` |

---

## 📊 Monitoring

```bash
# Voir les ressources en temps réel
docker stats

# Voir les logs détaillés
docker-compose logs -f flouapp --tail=50
```

---

## 🆘 Problèmes Courants

### Port 8081 déjà utilisé?

```bash
# Voir quel processus utilise le port
lsof -i :8081

# Tuer le processus
kill -9 <PID>
```

### L'app ne démarre pas?

```bash
# Vérifier les logs
docker-compose logs flouapp

# Reconstruire les images
docker-compose down
docker system prune
npm run start:docker
```

### Erreur de permission Docker?

```bash
# Donner les permissions
sudo usermod -aG docker $USER
newgrp docker
```

---

## 📝 À Savoir

- ✅ **L'app démarre automatiquement** après un crash (avec Docker/PM2/Systemd)
- ✅ **Les logs sont sauvegardés** dans `/logs/`
- ✅ **Hot reload activé** - les changements sont automatiquement rechargés
- ✅ **Port 80** utilisé (HTTP)
- ✅ **Port 443** disponible (HTTPS avec SSL)

---

## 🎯 Configuration Ultérieure

Voir **DEPLOYMENT_GUIDE.md** pour:
- Configuration SSL/TLS avec Let's Encrypt
- Configuration Nginx avancée
- Rate limiting et sécurité
- Monitoring et alertes
- Sauvegarde et restauration

---

**C'est prêt ! L'app tourne en continu et reprend automatiquement après un redémarrage.** 🚀
