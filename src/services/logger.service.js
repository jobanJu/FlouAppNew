// ============================================
// SERVICE LOGGER - Logging structuré
// ============================================

const config = require('../config');

// Niveaux de log
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

const currentLevel = config.server.isProduction ? LOG_LEVELS.INFO : LOG_LEVELS.DEBUG;

/**
 * Formatte un message de log en JSON structuré
 */
function formatLog(level, message, data = {}) {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...data,
    env: config.server.env
  });
}

/**
 * Log d'erreur
 */
function error(message, data = {}) {
  if (currentLevel >= LOG_LEVELS.ERROR) {
    console.error(formatLog('ERROR', message, data));
    
    // Envoyer à Sentry si configuré
    if (config.sentry.enabled && data.error) {
      // Sentry.captureException(data.error);
    }
  }
}

/**
 * Log d'avertissement
 */
function warn(message, data = {}) {
  if (currentLevel >= LOG_LEVELS.WARN) {
    console.warn(formatLog('WARN', message, data));
  }
}

/**
 * Log d'info
 */
function info(message, data = {}) {
  if (currentLevel >= LOG_LEVELS.INFO) {
    console.log(formatLog('INFO', message, data));
  }
}

/**
 * Log de debug (seulement en dev)
 */
function debug(message, data = {}) {
  if (currentLevel >= LOG_LEVELS.DEBUG) {
    console.log(formatLog('DEBUG', message, data));
  }
}

/**
 * Log d'événement métier (analytics)
 */
function event(eventName, data = {}) {
  console.log(formatLog('EVENT', eventName, {
    event: eventName,
    ...data
  }));
}

/**
 * Log de performance
 */
function perf(operation, durationMs, data = {}) {
  const level = durationMs > 1000 ? 'WARN' : 'INFO';
  console.log(formatLog(level, `Performance: ${operation}`, {
    operation,
    durationMs,
    slow: durationMs > 1000,
    ...data
  }));
}

/**
 * Log d'accès (pour audit)
 */
function access(req, res, durationMs) {
  console.log(formatLog('ACCESS', 'HTTP Request', {
    method: req.method,
    path: req.url,
    status: res.statusCode,
    durationMs,
    ip: req.headers['cf-connecting-ip'] || 
        req.headers['x-forwarded-for']?.split(',')[0] ||
        req.socket?.remoteAddress,
    userAgent: req.headers['user-agent']?.substring(0, 100)
  }));
}

/**
 * Log de sécurité
 */
function security(message, data = {}) {
  console.warn(formatLog('SECURITY', message, {
    alert: true,
    ...data
  }));
}

module.exports = {
  error,
  warn,
  info,
  debug,
  event,
  perf,
  access,
  security
};
