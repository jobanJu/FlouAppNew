// ============================================
// SECURITY MIDDLEWARE
// Headers de sécurité et validation
// ============================================

const config = require('../config');

/**
 * Headers de sécurité HTTP
 */
function securityHeaders(req, res, next) {
  // Protection XSS
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Content Security Policy (ajuster selon besoins)
  if (config.server.isProduction) {
    res.setHeader('Content-Security-Policy', 
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com https://cdn.jsdelivr.net https://download.agora.io https://challenges.cloudflare.com; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "font-src 'self' https://fonts.gstatic.com; " +
      "img-src 'self' data: blob: https: http:; " +
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.agora.io wss://*.agora.io https://*.sd-rtn.com wss://*.sd-rtn.com https://cdn.jsdelivr.net https://nominatim.openstreetmap.org https://challenges.cloudflare.com; " +
      "media-src 'self' blob:; " +
      "frame-src https://challenges.cloudflare.com;"
    );
  }
  
  // HSTS (uniquement en production avec HTTPS)
  if (config.server.isProduction) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  // Permissions Policy
  res.setHeader('Permissions-Policy', 
    'camera=(self), microphone=(self), geolocation=(self), fullscreen=(self)'
  );

  next();
}

/**
 * CORS configuré
 */
function corsMiddleware(req, res, next) {
  const origin = req.headers.origin;
  const allowedOrigins = config.security.corsOrigins;

  // Vérifier si l'origine est autorisée
  if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 
    'Content-Type, Authorization, X-Requested-With, X-Turnstile-Token, X-Client-Version'
  );
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24h cache preflight

  // Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  next();
}

/**
 * Validation et sanitization des inputs
 */
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  
  // Supprimer les caractères dangereux
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
}

/**
 * Middleware de sanitization pour le body
 */
function sanitizeBody(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    const sanitize = (obj) => {
      for (const key of Object.keys(obj)) {
        if (typeof obj[key] === 'string') {
          obj[key] = sanitizeInput(obj[key]);
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitize(obj[key]);
        }
      }
    };
    sanitize(req.body);
  }
  next();
}

/**
 * Vérification de l'authentification via token Supabase
 */
async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ 
      error: 'Unauthorized', 
      message: 'Token d\'authentification requis' 
    }));
  }

  const token = authHeader.split(' ')[1];
  
  try {
    // Vérifier le token via Supabase
    // Note: En production, utiliser supabase-js côté serveur
    // Pour l'instant, on fait confiance au token frontend
    req.token = token;
    next();
  } catch (error) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ 
      error: 'Invalid Token', 
      message: 'Token invalide ou expiré' 
    }));
  }
}

/**
 * Logging des requêtes pour audit
 */
function requestLogger(req, res, next) {
  const start = Date.now();
  const clientIP = req.headers['cf-connecting-ip'] || 
                   req.headers['x-forwarded-for']?.split(',')[0] ||
                   req.socket?.remoteAddress;

  // Log au finish de la response
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: clientIP,
      userAgent: req.headers['user-agent']?.substring(0, 100)
    };

    // Log différent selon le status
    if (res.statusCode >= 500) {
      console.error('[ERROR]', JSON.stringify(logData));
    } else if (res.statusCode >= 400) {
      console.warn('[WARN]', JSON.stringify(logData));
    } else if (duration > 1000) {
      console.warn('[SLOW]', JSON.stringify(logData));
    }
    // En dev, log tout
    else if (!config.server.isProduction) {
      console.log('[REQ]', JSON.stringify(logData));
    }
  });

  next();
}

module.exports = {
  securityHeaders,
  corsMiddleware,
  sanitizeInput,
  sanitizeBody,
  authMiddleware,
  requestLogger
};
