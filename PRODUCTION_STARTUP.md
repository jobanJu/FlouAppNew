# FlouApp - Production Startup Guide

## 🚀 Quick Start (Development)

### Option 1: Simple Bash Script
```bash
chmod +x start-app.sh
./start-app.sh
```
✅ Relance automatiquement les services s'ils crashent
✅ Logs dans le terminal
⚠️ Pas de persistence si serveur redémarre

### Option 2: PM2 (Production Recommended)
```bash
npm install -g pm2

# Start services with PM2
pm2 start ecosystem.config.js

# Keep alive across reboots
pm2 startup
pm2 save

# Monitor
pm2 monit
pm2 logs

# Stop
pm2 stop all
pm2 delete all
```

✅ Auto-restart on crash
✅ Persistent across server reboot
✅ Memory limits (500MB backend, 1GB frontend)
✅ Logs in ./logs/

## 📊 Services

| Service | Port | Process | Status |
|---------|------|---------|--------|
| Backend (Express) | 3001 | flouapp-backend | Running |
| Frontend (Expo) | 8081 | flouapp-frontend | Running |
| Vercel API | - | flouapp.vercel.app | Deployed |

## 🔍 Monitoring

**Check service status:**
```bash
pm2 status
```

**View logs:**
```bash
pm2 logs flouapp-backend
pm2 logs flouapp-frontend
```

**Restart a service:**
```bash
pm2 restart flouapp-backend
pm2 restart flouapp-frontend
```

## 🛠️ Troubleshooting

**Services not starting?**
```bash
# Kill all node processes
pkill -9 -f "node index.js"
pkill -9 -f "expo start"

# Then restart
./start-app.sh
# or
pm2 start ecosystem.config.js
```

**Port already in use?**
```bash
# Find process on port 3001
lsof -i :3001
kill -9 <PID>

# Find process on port 8081
lsof -i :8081
kill -9 <PID>
```

**Check environment variables:**
```bash
# Backend .env.local should have:
cat backend/.env.local

# Frontend .env should have:
cat .env
```

## 📝 Health Checks

**Backend health:**
```bash
curl http://localhost:3001/health
```

**Frontend:**
```bash
curl http://localhost:8081
```

**Vercel API:**
```bash
curl https://flouappnew.vercel.app/api/health
```

---

**Last Updated:** January 5, 2026
**PM2 Version:** Latest
**Node Version:** 18+
