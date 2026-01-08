// ============================================
// SERVICE CACHE - Redis ou In-Memory
// ============================================

const config = require('../config');

// Cache en mémoire (fallback si pas de Redis)
const memoryCache = new Map();

// Client Redis (optionnel)
let redisClient = null;

/**
 * Initialise la connexion Redis si configurée
 */
async function initRedis() {
  if (!config.redis.enabled) {
    console.log('[CACHE] Using in-memory cache (Redis not configured)');
    return false;
  }

  try {
    // Dynamic import pour éviter l'erreur si redis n'est pas installé
    const { createClient } = await import('redis');
    
    redisClient = createClient({ url: config.redis.url });
    redisClient.on('error', (err) => console.error('[REDIS] Error:', err));
    redisClient.on('connect', () => console.log('[REDIS] Connected'));
    
    await redisClient.connect();
    return true;
  } catch (error) {
    console.warn('[CACHE] Redis not available, using in-memory:', error.message);
    return false;
  }
}

/**
 * Récupère une valeur du cache
 * @param {string} key 
 * @returns {Promise<any>}
 */
async function get(key) {
  try {
    if (redisClient?.isReady) {
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    }
    
    const cached = memoryCache.get(key);
    if (cached && cached.expiry > Date.now()) {
      return cached.value;
    }
    
    memoryCache.delete(key);
    return null;
  } catch (error) {
    console.error('[CACHE] Get error:', error);
    return null;
  }
}

/**
 * Stocke une valeur dans le cache
 * @param {string} key 
 * @param {any} value 
 * @param {number} ttlSeconds - Time to live en secondes
 */
async function set(key, value, ttlSeconds = 300) {
  try {
    if (redisClient?.isReady) {
      await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
      return true;
    }
    
    memoryCache.set(key, {
      value,
      expiry: Date.now() + (ttlSeconds * 1000)
    });
    return true;
  } catch (error) {
    console.error('[CACHE] Set error:', error);
    return false;
  }
}

/**
 * Supprime une clé du cache
 * @param {string} key 
 */
async function del(key) {
  try {
    if (redisClient?.isReady) {
      await redisClient.del(key);
    }
    memoryCache.delete(key);
    return true;
  } catch (error) {
    console.error('[CACHE] Delete error:', error);
    return false;
  }
}

/**
 * Supprime les clés correspondant à un pattern
 * @param {string} pattern - Ex: "user:*" 
 */
async function delPattern(pattern) {
  try {
    if (redisClient?.isReady) {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    }
    
    // Pour le cache mémoire
    const regex = new RegExp('^' + pattern.replace('*', '.*') + '$');
    for (const key of memoryCache.keys()) {
      if (regex.test(key)) {
        memoryCache.delete(key);
      }
    }
    return true;
  } catch (error) {
    console.error('[CACHE] Delete pattern error:', error);
    return false;
  }
}

/**
 * Cache-aside pattern: récupère ou calcule
 * @param {string} key 
 * @param {Function} fetchFn - Fonction pour récupérer la donnée
 * @param {number} ttlSeconds 
 */
async function getOrSet(key, fetchFn, ttlSeconds = 300) {
  let value = await get(key);
  
  if (value !== null) {
    return value;
  }
  
  value = await fetchFn();
  
  if (value !== null && value !== undefined) {
    await set(key, value, ttlSeconds);
  }
  
  return value;
}

/**
 * Statistiques du cache
 */
function getStats() {
  return {
    type: redisClient?.isReady ? 'redis' : 'memory',
    memorySize: memoryCache.size,
    redisConnected: redisClient?.isReady || false
  };
}

// Nettoyage périodique du cache mémoire
setInterval(() => {
  const now = Date.now();
  let cleaned = 0;
  for (const [key, data] of memoryCache.entries()) {
    if (data.expiry < now) {
      memoryCache.delete(key);
      cleaned++;
    }
  }
  if (cleaned > 0) {
    console.log(`[CACHE] Cleaned ${cleaned} expired entries`);
  }
}, 60000);

module.exports = {
  initRedis,
  get,
  set,
  del,
  delPattern,
  getOrSet,
  getStats
};
