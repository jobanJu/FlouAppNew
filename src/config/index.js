// ============================================
// CONFIGURATION CENTRALISÉE - FLOU APP
// ============================================

require('dotenv').config();

module.exports = {
  // Server
  server: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development',
    isProduction: process.env.NODE_ENV === 'production'
  },

  // Supabase
  supabase: {
    url: process.env.SUPABASE_URL || 'https://lqzsgugobujvweeuxves.supabase.co',
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceKey: process.env.SUPABASE_SERVICE_KEY // Pour opérations admin côté serveur
  },

  // Agora (Video/Audio)
  agora: {
    appId: process.env.AGORA_APP_ID || '2d6f68f6a59b4622ac64393266c8f828',
    appCertificate: process.env.AGORA_APP_CERTIFICATE || '166070eec4344f8e8374f701324d5c6a',
    tokenExpiry: 3600 // 1 hour
  },

  // Redis (Cache & Sessions)
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    enabled: !!process.env.REDIS_URL
  },

  // Cloudflare Turnstile (Anti-bot)
  turnstile: {
    siteKey: process.env.TURNSTILE_SITE_KEY,
    secretKey: process.env.TURNSTILE_SECRET_KEY,
    enabled: !!process.env.TURNSTILE_SECRET_KEY
  },

  // Rate Limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // requests per window
    auth: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 10 // login attempts per hour
    },
    signup: {
      windowMs: 24 * 60 * 60 * 1000, // 24 hours
      max: 5 // signups per day per IP
    }
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-key-change-in-production',
    accessExpiry: '15m',
    refreshExpiry: '7d'
  },

  // Sentry (Error Tracking)
  sentry: {
    dsn: process.env.SENTRY_DSN,
    enabled: !!process.env.SENTRY_DSN
  },

  // Cloudinary (Image CDN)
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
    enabled: !!process.env.CLOUDINARY_CLOUD_NAME
  },

  // Matching Engine
  matching: {
    cacheExpiry: 5 * 60, // 5 minutes
    batchSize: 50,
    maxDistance: 100, // km
    minCommonInterests: 2
  },

  // Security
  security: {
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['*'],
    trustedProxies: process.env.TRUSTED_PROXIES?.split(',') || []
  }
};
