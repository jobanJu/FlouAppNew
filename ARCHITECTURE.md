# 🏗️ Architecture Technique - Flou App v2.0

## Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────┐
│                      CLOUDFLARE                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   WAF       │  │  Turnstile  │  │    CDN      │         │
│  │ (Security)  │  │  (Anti-bot) │  │  (Assets)   │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     RAILWAY (Backend)                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                 server.v2.js                          │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐           │   │
│  │  │  Rate    │  │ Security │  │  Logger  │           │   │
│  │  │ Limiter  │  │ Headers  │  │          │           │   │
│  │  └──────────┘  └──────────┘  └──────────┘           │   │
│  │                                                       │   │
│  │  ┌─────────────────────────────────────────────┐     │   │
│  │  │               SERVICES                       │     │   │
│  │  │  ┌────────┐ ┌────────┐ ┌────────┐          │     │   │
│  │  │  │ Agora  │ │Matching│ │ Cache  │          │     │   │
│  │  │  └────────┘ └────────┘ └────────┘          │     │   │
│  │  └─────────────────────────────────────────────┘     │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
         │                              │
         ▼                              ▼
┌─────────────────┐          ┌─────────────────┐
│    SUPABASE     │          │   REDIS (opt)   │
│  ┌───────────┐  │          │                 │
│  │ PostgreSQL│  │          │ - Match Cache   │
│  │ + RLS     │  │          │ - Rate Limits   │
│  ├───────────┤  │          │ - Sessions      │
│  │  Storage  │  │          └─────────────────┘
│  │  (Photos) │  │
│  ├───────────┤  │
│  │ Realtime  │  │
│  │(WebSocket)│  │
│  ├───────────┤  │
│  │   Auth    │  │
│  └───────────┘  │
└─────────────────┘
```

## Structure des fichiers

```
FlouAppNew/
├── server.v2.js          # Serveur principal (nouvelle architecture)
├── server.js             # Serveur legacy (backup)
├── package.json          # Dépendances
├── .env.example          # Template de configuration
│
├── src/
│   ├── config/
│   │   └── index.js      # Configuration centralisée
│   │
│   ├── middleware/
│   │   ├── rateLimiter.js    # Protection anti-spam
│   │   ├── turnstile.js      # Protection anti-bot
│   │   └── security.js       # Headers, CORS, sanitization
│   │
│   └── services/
│       ├── agora.service.js     # Génération tokens video
│       ├── cache.service.js     # Cache Redis/Memory
│       ├── matching.service.js  # Algorithme de matching
│       └── logger.service.js    # Logging structuré
│
├── public/               # Frontend (SPA)
│   ├── index.html        # Application principale
│   ├── sw.js             # Service Worker (PWA)
│   └── assets/           # Images, CSS, etc.
│
└── supabase_*.sql        # Migrations base de données
```

## Sécurité implémentée

### 1. Rate Limiting
- **Général**: 100 req/15min par IP
- **Auth**: 10 tentatives/heure
- **Signup**: 5 inscriptions/jour par IP

### 2. Headers de sécurité
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security` (HSTS)
- `Content-Security-Policy`

### 3. Protection anti-bot
- Cloudflare Turnstile sur inscription
- Validation côté serveur

### 4. Row Level Security (RLS)
- Chaque utilisateur ne voit que ses données
- Profils filtrés (bloqués exclus)
- Messages accessibles uniquement aux participants du match

## Matching Engine

### Algorithme de scoring (0-100 points)

| Critère | Points max | Logique |
|---------|------------|---------|
| Compatibilité genre | 20 | Obligatoire (0 si non compatible) |
| Distance | 30 | <10km=30, <25km=25, <50km=15 |
| Intérêts communs | 40 | 8 points par intérêt (min 2 requis) |
| Différence d'âge | 10 | <3ans=10, <5ans=8, <10ans=5 |

### Cache
- TTL: 5 minutes
- Invalidation sur modification profil
- Redis en production, Memory en dev

## API Endpoints

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/agora-token` | Générer token video |
| POST | `/api/auth/signup` | Validation inscription |
| POST | `/api/matches/calculate` | Calculer matches |
| POST | `/api/matches/invalidate` | Vider cache matches |
| GET | `/api/cache/stats` | Stats du cache |

## Déploiement

### Variables d'environnement requises
```bash
NODE_ENV=production
SUPABASE_URL=xxx
SUPABASE_ANON_KEY=xxx
JWT_SECRET=xxx
```

### Variables optionnelles (recommandées en prod)
```bash
REDIS_URL=redis://...
TURNSTILE_SITE_KEY=xxx
TURNSTILE_SECRET_KEY=xxx
SENTRY_DSN=xxx
```

## Prochaines étapes

### Court terme
- [ ] Activer Cloudflare Turnstile
- [ ] Configurer Redis sur Railway
- [ ] Ajouter Sentry pour monitoring erreurs

### Moyen terme
- [ ] WebSocket pour messages temps réel
- [ ] Queue (BullMQ) pour tâches asynchrones
- [ ] CI/CD avec tests automatiques

### Long terme
- [ ] Microservices (auth, matching, messaging)
- [ ] CDN images (Cloudinary)
- [ ] Analytics (PostHog)
