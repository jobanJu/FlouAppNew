# 🔐 GUIDE DE SÉCURITÉ - FLOU APP

## ✅ Mesures Implémentées

### 1. Rate Limiting
- **Fichier**: `src/middleware/rateLimiter.js`
- Limite générale: 100 req/min
- Limite auth: 5 tentatives/15min
- Limite signup: 3 tentatives/heure
- Headers RFC 6585 (X-RateLimit-*)

### 2. Protection Anti-Bot (Turnstile)
- **Fichier**: `src/middleware/turnstile.js`
- Cloudflare Turnstile pour signup
- Vérification serveur des tokens

### 3. Headers de Sécurité
- **Fichier**: `src/middleware/security.js`
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- HSTS en production
- CSP restrictif

### 4. Validation Backend
- **Fichier**: `src/middleware/securityComplete.js`
- Validation email, password, username, age, message
- Schema validation type Zod
- Sanitization des inputs

### 5. Protection CSRF
- **Fichier**: `src/middleware/securityComplete.js`
- Tokens CSRF générés par session
- Expiration 1 heure
- Validation obligatoire sur mutations

### 6. Chiffrement
- **Fichier**: `src/middleware/securityComplete.js`
- AES-256-GCM
- IV unique par chiffrement
- AuthTag pour intégrité

### 7. Modération de Contenu
- **Fichier**: `src/middleware/securityComplete.js`
- Liste de mots bannis
- Détection patterns suspects (tel, email, liens)
- Détection spam (répétition)

### 8. Trust Score
- **Fichier**: `src/middleware/securityComplete.js`
- Score initial: 100 points
- Pénalités: -5 (minor) à -50 (critical)
- Bonus: +2 à +15
- Shadow ban automatique < 20 points

### 9. Logs de Sécurité
- **Fichier**: `src/middleware/securityComplete.js`
- Logging des événements critiques
- Conservation en mémoire (10000 max)
- Filtrage par type/sévérité

### 10. Anti-Brute Force
- **Fichier**: `src/middleware/securityComplete.js`
- Fenêtre 15 minutes
- Blocage après 5 tentatives login
- Blocage après 3 tentatives signup

---

## 📦 SQL à Exécuter

### Tables de Sécurité
```bash
# Dans Supabase SQL Editor:
# 1. supabase_security.sql (tables logs, trust score, violations, reports, blocks)
# 2. supabase_favorites_nimbes.sql (favorites, nimbes)
```

---

## 🔧 Variables d'Environnement Requises

```env
# Chiffrement
ENCRYPTION_KEY=votre-clé-32-caractères-minimum

# Turnstile (Cloudflare)
TURNSTILE_SITE_KEY=votre-site-key
TURNSTILE_SECRET_KEY=votre-secret-key

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_KEY=xxx

# Agora
AGORA_APP_ID=xxx
AGORA_APP_CERTIFICATE=xxx
```

---

## 📋 Plan de Sécurisation 30 jours

### Semaine 1 ✅
- [x] Rate limiting
- [x] Anti-bot (Turnstile)
- [x] Validation backend
- [x] Headers de sécurité

### Semaine 2 🔄
- [x] Protection CSRF
- [x] Anti-brute force
- [ ] Cookies sécurisés (à activer en prod)
- [x] RLS Supabase renforcé

### Semaine 3 🔄
- [x] Chiffrement données sensibles
- [x] Modération contenu
- [x] Trust Score
- [x] Logs sécurité

### Semaine 4 📋
- [ ] Tests d'intrusion
- [ ] Incident Response Plan
- [ ] Audit RGPD complet
- [ ] Export données utilisateur

---

## ⚠️ Actions Immédiates Requises

### 1. Activer Turnstile
```javascript
// Dans config.js
turnstile: {
  enabled: true, // Passer à true
  siteKey: process.env.TURNSTILE_SITE_KEY,
  secretKey: process.env.TURNSTILE_SECRET_KEY
}
```

### 2. Définir ENCRYPTION_KEY
```bash
# Générer une clé sécurisée
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Exécuter les SQL
- `supabase_security.sql`
- `supabase_favorites_nimbes.sql`

### 4. Configurer Cloudflare
- Activer WAF
- Activer rate limiting
- Activer bot protection

---

## 🚨 En Cas d'Incident

### 1. Fuite de Données
1. Identifier la source
2. Révoquer tous les tokens/sessions
3. Notifier CNIL sous 72h
4. Notifier utilisateurs concernés
5. Audit complet

### 2. Attaque DDoS
1. Activer mode "Under Attack" Cloudflare
2. Réduire rate limits
3. Bloquer IPs suspectes

### 3. Compte Compromis
1. Révoquer sessions
2. Forcer reset mot de passe
3. Vérifier activité suspecte
4. Notifier utilisateur

---

## 📊 Monitoring Recommandé

- **Sentry**: Erreurs JS/Backend
- **PostHog**: Analytics + comportement
- **Cloudflare**: WAF + DDoS + Rate limiting
- **Supabase Dashboard**: Queries + RLS violations

---

## 🔗 Ressources

- [OWASP Top 10](https://owasp.org/Top10/)
- [RGPD Guide CNIL](https://www.cnil.fr/fr/rgpd-de-quoi-parle-t-on)
- [Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/)
- [Supabase Security](https://supabase.com/docs/guides/auth/row-level-security)
