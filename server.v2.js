// ============================================
// FLOU APP - SERVEUR PRINCIPAL v2.0
// Architecture modulaire et sécurisée
// ============================================

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Configuration
const config = require('./src/config');

// Services
const agoraService = require('./src/services/agora.service');
const cacheService = require('./src/services/cache.service');
const matchingService = require('./src/services/matching.service');
const logger = require('./src/services/logger.service');

// Middleware
const { generalLimiter, authLimiter, signupLimiter, getClientIP } = require('./src/middleware/rateLimiter');
const { verifyTurnstile } = require('./src/middleware/turnstile');
const { securityHeaders, corsMiddleware, requestLogger, sanitizeInput } = require('./src/middleware/security');

// Stripe
let stripe = null;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
if (STRIPE_SECRET_KEY) {
  try {
    const Stripe = require('stripe');
    stripe = new Stripe(STRIPE_SECRET_KEY);
    console.log('✅ Stripe initialized');
  } catch (e) {
    console.warn('⚠️ Stripe not available:', e.message);
  }
}

const PORT = config.server.port;
const publicDir = path.join(__dirname, 'public');

logger.info('Starting Flou Server v2.0', { 
  port: PORT, 
  env: config.server.env,
  features: {
    redis: config.redis.enabled,
    turnstile: config.turnstile.enabled,
    sentry: config.sentry.enabled
  }
});

// ==================== MIDDLEWARE CHAIN ====================
function runMiddleware(req, res, middlewares, index = 0) {
  if (index >= middlewares.length) return;
  
  const middleware = middlewares[index];
  middleware(req, res, () => runMiddleware(req, res, middlewares, index + 1));
}

// ==================== REQUEST BODY PARSER ====================
async function parseBody(req) {
  return new Promise((resolve, reject) => {
    if (req.method === 'GET' || req.method === 'OPTIONS') {
      return resolve(null);
    }
    
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      // Limite à 1MB
      if (body.length > 1024 * 1024) {
        reject(new Error('Body too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : null);
      } catch {
        resolve(body);
      }
    });
    req.on('error', reject);
  });
}

// ==================== RESPONSE HELPERS ====================
function sendJSON(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function sendError(res, status, message, details = null) {
  sendJSON(res, status, {
    error: true,
    message,
    ...(details && !config.server.isProduction ? { details } : {})
  });
}

// ==================== API ROUTES ====================
const apiRoutes = {
  // Health check
  'GET /health': (req, res) => {
    sendJSON(res, 200, { 
      status: 'ok',
      version: '2.0.0',
      cache: cacheService.getStats(),
      timestamp: new Date().toISOString()
    });
  },

  // Agora token
  'GET /api/agora-token': (req, res, query) => {
    const { channel, uid, role } = query;
    
    const validation = agoraService.validateChannelName(channel);
    if (!validation.valid) {
      return sendError(res, 400, validation.error);
    }

    try {
      const token = agoraService.generateRtcToken(channel, parseInt(uid) || 0, role);
      sendJSON(res, 200, { 
        token, 
        appId: agoraService.appId,
        expiresIn: config.agora.tokenExpiry
      });
    } catch (error) {
      logger.error('Agora token generation failed', { error: error.message, channel });
      sendError(res, 500, 'Token generation failed');
    }
  },

  // Signup avec protection anti-bot
  'POST /api/auth/signup': async (req, res, query, body) => {
    // Vérifier Turnstile
    const turnstileResult = await verifyTurnstile(
      body?.turnstileToken,
      getClientIP(req)
    );
    
    if (!turnstileResult.success) {
      logger.security('Signup blocked - Turnstile failed', { ip: getClientIP(req) });
      return sendError(res, 403, turnstileResult.error);
    }

    // Validation basique
    if (!body?.email || !body?.password) {
      return sendError(res, 400, 'Email et mot de passe requis');
    }

    logger.event('signup_attempt', { email: body.email?.substring(0, 3) + '***' });
    
    // Le signup réel est géré par Supabase côté client
    // Ici on pourrait ajouter des validations supplémentaires
    sendJSON(res, 200, { ok: true, message: 'Validation passed' });
  },

  // Calcul de matches (avec cache)
  'POST /api/matches/calculate': async (req, res, query, body) => {
    const { currentUser, candidates, options } = body || {};
    
    if (!currentUser || !candidates) {
      return sendError(res, 400, 'currentUser et candidates requis');
    }

    const startTime = Date.now();
    
    try {
      const matches = await matchingService.generateMatches(
        currentUser,
        candidates,
        options
      );
      
      logger.perf('match_calculation', Date.now() - startTime, {
        userId: currentUser.id,
        candidatesCount: candidates.length,
        matchesCount: matches.length
      });

      sendJSON(res, 200, { matches });
    } catch (error) {
      logger.error('Match calculation failed', { error: error.message });
      sendError(res, 500, 'Erreur calcul matches');
    }
  },

  // Invalidation cache matches
  'POST /api/matches/invalidate': async (req, res, query, body) => {
    const { userId } = body || {};
    
    if (userId) {
      await matchingService.invalidateMatchCache(userId);
    } else {
      await matchingService.invalidateAllMatchCaches();
    }
    
    sendJSON(res, 200, { ok: true });
  },

  // Stats cache
  'GET /api/cache/stats': (req, res) => {
    sendJSON(res, 200, cacheService.getStats());
  },

  // ==================== STRIPE ROUTES ====================
  
  // Créer une session Stripe Checkout
  'POST /api/create-checkout-session': async (req, res, query, body) => {
    if (!stripe) {
      return sendError(res, 503, 'Service de paiement non disponible');
    }

    const { priceId, userId, mode, metadata, successUrl, cancelUrl } = body || {};

    if (!priceId || !userId) {
      return sendError(res, 400, 'priceId et userId requis');
    }

    try {
      const sessionConfig = {
        payment_method_types: ['card'],
        line_items: [{
          price: priceId,
          quantity: 1,
        }],
        mode: mode || 'payment', // 'payment' ou 'subscription'
        success_url: successUrl || `${config.server.baseUrl}/shop?success=true`,
        cancel_url: cancelUrl || `${config.server.baseUrl}/shop?canceled=true`,
        metadata: {
          userId: userId,
          ...(metadata || {})
        },
        client_reference_id: userId
      };

      const session = await stripe.checkout.sessions.create(sessionConfig);
      
      logger.info('Stripe checkout session created', { 
        sessionId: session.id, 
        userId, 
        mode,
        priceId 
      });

      sendJSON(res, 200, { 
        sessionId: session.id,
        url: session.url 
      });
    } catch (error) {
      logger.error('Stripe checkout error', { error: error.message, userId });
      sendError(res, 500, 'Erreur création session de paiement', error.message);
    }
  },

  // Webhook Stripe (pour les événements de paiement)
  'POST /api/stripe-webhook': async (req, res, query, body) => {
    if (!stripe) {
      return sendError(res, 503, 'Service de paiement non disponible');
    }

    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const sig = req.headers['stripe-signature'];

    let event;

    try {
      // Pour les webhooks, le body doit être raw
      if (endpointSecret && sig) {
        event = stripe.webhooks.constructEvent(req.rawBody || JSON.stringify(body), sig, endpointSecret);
      } else {
        // Mode sans vérification (dev/test)
        event = body;
      }
    } catch (err) {
      logger.error('Stripe webhook signature verification failed', { error: err.message });
      return sendError(res, 400, `Webhook Error: ${err.message}`);
    }

    // Gérer les événements Stripe
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.userId || session.client_reference_id;
        
        logger.info('Payment completed', { 
          sessionId: session.id, 
          userId,
          amount: session.amount_total,
          mode: session.mode
        });
        
        // TODO: Mettre à jour Supabase selon le type d'achat
        // - Si subscription: mettre à jour subscription_tier
        // - Si achat Brumes: créditer le compte
        break;
      }
      
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        logger.info('Subscription event', { 
          subscriptionId: subscription.id,
          status: subscription.status,
          type: event.type
        });
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        logger.info('Subscription canceled', { 
          subscriptionId: subscription.id 
        });
        // TODO: Révoquer l'abonnement dans Supabase
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        logger.warn('Payment failed', { 
          paymentIntentId: paymentIntent.id,
          error: paymentIntent.last_payment_error?.message
        });
        break;
      }

      default:
        logger.debug('Unhandled Stripe event', { type: event.type });
    }

    sendJSON(res, 200, { received: true });
  },

  // Récupérer les prix Stripe disponibles
  'GET /api/stripe-prices': async (req, res) => {
    if (!stripe) {
      return sendError(res, 503, 'Service de paiement non disponible');
    }

    try {
      const prices = await stripe.prices.list({
        active: true,
        expand: ['data.product'],
        limit: 20
      });

      const formattedPrices = prices.data.map(price => ({
        id: price.id,
        productId: price.product.id,
        productName: price.product.name,
        amount: price.unit_amount / 100, // Convertir centimes en euros
        currency: price.currency,
        type: price.type, // 'one_time' ou 'recurring'
        interval: price.recurring?.interval
      }));

      sendJSON(res, 200, { prices: formattedPrices });
    } catch (error) {
      logger.error('Get Stripe prices error', { error: error.message });
      sendError(res, 500, 'Erreur récupération des prix');
    }
  }
};

// ==================== MAIN REQUEST HANDLER ====================
const server = http.createServer(async (req, res) => {
  const startTime = Date.now();
  
  try {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    const query = parsedUrl.query;

    // Middleware chain
    const middlewares = [
      securityHeaders,
      corsMiddleware,
      requestLogger
    ];

    // Run middleware
    await new Promise(resolve => {
      let index = 0;
      const next = () => {
        if (index >= middlewares.length) {
          resolve();
          return;
        }
        middlewares[index++](req, res, next);
      };
      next();
    });

    // Si réponse déjà envoyée (OPTIONS, etc.)
    if (res.writableEnded) return;

    // Parse body pour POST/PUT
    const body = await parseBody(req);
    req.body = body;

    // Health check (sans rate limit)
    if (pathname === '/health' || pathname === '/status') {
      return apiRoutes['GET /health'](req, res);
    }

    // API Routes
    const routeKey = `${req.method} ${pathname}`;
    const handler = apiRoutes[routeKey];
    
    if (handler) {
      // Rate limiting par type de route
      const limiter = pathname.includes('/auth/') ? authLimiter :
                      pathname.includes('/signup') ? signupLimiter :
                      generalLimiter;
      
      return limiter(req, res, () => handler(req, res, query, body));
    }

    // Static files
    let filePath = pathname === '/' ? '/index.html' : pathname;
    filePath = path.join(publicDir, filePath);

    // Sécurité: empêcher path traversal
    if (!filePath.startsWith(publicDir)) {
      logger.security('Path traversal attempt', { path: pathname, ip: getClientIP(req) });
      return sendError(res, 403, 'Forbidden');
    }

    fs.readFile(filePath, (err, data) => {
      if (err) {
        if (err.code === 'ENOENT') {
          // SPA fallback: renvoyer index.html pour les routes frontend
          if (!pathname.includes('.')) {
            return fs.readFile(path.join(publicDir, 'index.html'), (err2, data2) => {
              if (err2) return sendError(res, 404, 'Not Found');
              res.writeHead(200, { 'Content-Type': 'text/html' });
              res.end(data2);
            });
          }
          return sendError(res, 404, 'Not Found');
        }
        return sendError(res, 500, 'Server Error');
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentTypes = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'application/javascript',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.webp': 'image/webp',
        '.mp4': 'video/mp4',
        '.webm': 'video/webm',
        '.woff': 'font/woff',
        '.woff2': 'font/woff2',
        '.ttf': 'font/ttf',
        '.ico': 'image/x-icon',
        '.webmanifest': 'application/manifest+json'
      };

      const contentType = contentTypes[ext] || 'application/octet-stream';
      
      // Cache headers
      const cacheControl = ['.html', '.js'].includes(ext) 
        ? 'no-cache, no-store, must-revalidate'
        : 'public, max-age=31536000'; // 1 an pour assets

      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': cacheControl
      });
      res.end(data);

      // Log access
      logger.access(req, res, Date.now() - startTime);
    });

  } catch (error) {
    logger.error('Unhandled server error', { error: error.message, stack: error.stack });
    sendError(res, 500, 'Internal Server Error');
  }
});

// ==================== ERROR HANDLERS ====================
server.on('error', (err) => {
  logger.error('Server error event', { error: err.message });
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', { error: err.message, stack: err.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection', { reason: String(reason) });
});

// ==================== STARTUP ====================
async function start() {
  // Initialize cache (Redis if available)
  await cacheService.initRedis();
  
  server.listen(PORT, '0.0.0.0', () => {
    logger.info('Server started', { port: PORT, url: `http://localhost:${PORT}` });
    console.log(`\n✅ Flou Server v2.0 running on port ${PORT}`);
    console.log(`   Environment: ${config.server.env}`);
    console.log(`   Cache: ${cacheService.getStats().type}`);
    console.log(`   Turnstile: ${config.turnstile.enabled ? 'enabled' : 'disabled'}`);
  });
}

// Graceful shutdown
function shutdown(signal) {
  logger.info('Shutting down', { signal });
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
  
  // Force exit after 10s
  setTimeout(() => {
    logger.warn('Forced shutdown');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Start server
start().catch(err => {
  logger.error('Startup failed', { error: err.message });
  process.exit(1);
});
