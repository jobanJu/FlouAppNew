// ============================================
// RATE LIMITER MIDDLEWARE
// Protection contre brute force et spam
// ============================================

const config = require('../config');

// Store en mémoire (remplacer par Redis en prod)
const stores = {
  general: new Map(),
  auth: new Map(),
  signup: new Map()
};

// Nettoyer les entrées expirées périodiquement
setInterval(() => {
  const now = Date.now();
  for (const store of Object.values(stores)) {
    for (const [key, data] of store.entries()) {
      if (now > data.resetTime) {
        store.delete(key);
      }
    }
  }
}, 60000); // Toutes les minutes

/**
 * Crée un middleware de rate limiting
 * @param {string} type - Type de limite ('general', 'auth', 'signup')
 */
function createRateLimiter(type = 'general') {
  const limits = {
    general: config.rateLimit,
    auth: config.rateLimit.auth,
    signup: config.rateLimit.signup
  };

  const limit = limits[type] || limits.general;
  const store = stores[type] || stores.general;

  return (req, res, next) => {
    // Identifier le client (IP + User-Agent pour plus de précision)
    const clientIP = getClientIP(req);
    const key = `${clientIP}:${type}`;

    const now = Date.now();
    let record = store.get(key);

    if (!record || now > record.resetTime) {
      // Nouvelle fenêtre
      record = {
        count: 1,
        resetTime: now + limit.windowMs,
        firstRequest: now
      };
      store.set(key, record);
    } else {
      record.count++;
    }

    // Headers de rate limit (RFC 6585)
    const remaining = Math.max(0, limit.max - record.count);
    const resetSeconds = Math.ceil((record.resetTime - now) / 1000);

    res.setHeader('X-RateLimit-Limit', limit.max);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));
    res.setHeader('Retry-After', resetSeconds);

    if (record.count > limit.max) {
      // Log tentative de dépassement
      console.warn(`[RATE LIMIT] ${type} exceeded for ${clientIP}`, {
        count: record.count,
        limit: limit.max,
        ip: clientIP,
        path: req.url,
        timestamp: new Date().toISOString()
      });

      res.writeHead(429, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        error: 'Too Many Requests',
        message: `Trop de requêtes. Réessaie dans ${resetSeconds} secondes.`,
        retryAfter: resetSeconds
      }));
    }

    next();
  };
}

/**
 * Extrait l'IP réelle du client (derrière proxy/Cloudflare)
 */
function getClientIP(req) {
  // Cloudflare
  const cfIP = req.headers['cf-connecting-ip'];
  if (cfIP) return cfIP;

  // X-Forwarded-For (premier IP = client original)
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ips = forwarded.split(',').map(ip => ip.trim());
    return ips[0];
  }

  // X-Real-IP
  const realIP = req.headers['x-real-ip'];
  if (realIP) return realIP;

  // Fallback
  return req.socket?.remoteAddress || 'unknown';
}

/**
 * Réinitialiser le compteur pour un client (après login réussi par ex.)
 */
function resetLimit(type, clientIP) {
  const store = stores[type];
  if (store) {
    store.delete(`${clientIP}:${type}`);
  }
}

/**
 * Bloquer temporairement une IP
 */
function blockIP(clientIP, durationMs = 3600000) {
  for (const [type, store] of Object.entries(stores)) {
    store.set(`${clientIP}:${type}`, {
      count: Infinity,
      resetTime: Date.now() + durationMs,
      blocked: true
    });
  }
}

module.exports = {
  createRateLimiter,
  getClientIP,
  resetLimit,
  blockIP,
  
  // Middlewares pré-configurés
  generalLimiter: createRateLimiter('general'),
  authLimiter: createRateLimiter('auth'),
  signupLimiter: createRateLimiter('signup')
};
