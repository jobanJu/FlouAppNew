// ============================================
// SECURITY COMPLETE - Protection Flou App
// Implémentation des correctifs du rapport de sécurité
// ============================================

const crypto = require('crypto');

// ============================================
// 1. VALIDATION BACKEND (Zod-like validation)
// ============================================

const validators = {
  // Règles de validation
  email: (value) => {
    if (!value || typeof value !== 'string') return { valid: false, error: 'Email requis' };
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return { valid: false, error: 'Email invalide' };
    if (value.length > 255) return { valid: false, error: 'Email trop long' };
    return { valid: true };
  },

  password: (value) => {
    if (!value || typeof value !== 'string') return { valid: false, error: 'Mot de passe requis' };
    if (value.length < 8) return { valid: false, error: 'Mot de passe trop court (min 8 caractères)' };
    if (value.length > 128) return { valid: false, error: 'Mot de passe trop long' };
    if (!/[A-Z]/.test(value)) return { valid: false, error: 'Doit contenir une majuscule' };
    if (!/[a-z]/.test(value)) return { valid: false, error: 'Doit contenir une minuscule' };
    if (!/[0-9]/.test(value)) return { valid: false, error: 'Doit contenir un chiffre' };
    return { valid: true };
  },

  username: (value) => {
    if (!value || typeof value !== 'string') return { valid: false, error: 'Nom requis' };
    if (value.length < 2) return { valid: false, error: 'Nom trop court' };
    if (value.length > 50) return { valid: false, error: 'Nom trop long' };
    if (!/^[a-zA-ZÀ-ÿ\s'-]+$/.test(value)) return { valid: false, error: 'Caractères non autorisés' };
    return { valid: true };
  },

  age: (value) => {
    const age = parseInt(value);
    if (isNaN(age)) return { valid: false, error: 'Âge invalide' };
    if (age < 18) return { valid: false, error: 'Âge minimum: 18 ans' };
    if (age > 120) return { valid: false, error: 'Âge invalide' };
    return { valid: true };
  },

  message: (value) => {
    if (!value || typeof value !== 'string') return { valid: false, error: 'Message requis' };
    if (value.length > 2000) return { valid: false, error: 'Message trop long (max 2000)' };
    return { valid: true };
  },

  uuid: (value) => {
    if (!value || typeof value !== 'string') return { valid: false, error: 'ID requis' };
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(value)) return { valid: false, error: 'ID invalide' };
    return { valid: true };
  }
};

function validateSchema(data, schema) {
  const errors = [];
  
  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];
    
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push({ field, error: `${field} est requis` });
      continue;
    }
    
    if (value !== undefined && value !== null && rules.type) {
      const validator = validators[rules.type];
      if (validator) {
        const result = validator(value);
        if (!result.valid) {
          errors.push({ field, error: result.error });
        }
      }
    }
    
    if (rules.custom && value !== undefined) {
      const customResult = rules.custom(value);
      if (!customResult.valid) {
        errors.push({ field, error: customResult.error });
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// ============================================
// 2. PROTECTION CSRF
// ============================================

const csrfTokens = new Map();

function generateCSRFToken(sessionId) {
  const token = crypto.randomBytes(32).toString('hex');
  csrfTokens.set(sessionId, {
    token,
    createdAt: Date.now(),
    expiresAt: Date.now() + 3600000 // 1 heure
  });
  return token;
}

function validateCSRFToken(sessionId, token) {
  const stored = csrfTokens.get(sessionId);
  if (!stored) return false;
  if (Date.now() > stored.expiresAt) {
    csrfTokens.delete(sessionId);
    return false;
  }
  return stored.token === token;
}

// Nettoyer les tokens expirés
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of csrfTokens.entries()) {
    if (now > value.expiresAt) {
      csrfTokens.delete(key);
    }
  }
}, 300000); // Toutes les 5 minutes

// ============================================
// 3. CHIFFREMENT DES DONNÉES SENSIBLES
// ============================================

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const ALGORITHM = 'aes-256-gcm';

function encrypt(text) {
  if (!text) return null;
  
  const iv = crypto.randomBytes(16);
  const key = Buffer.from(ENCRYPTION_KEY.slice(0, 32).padEnd(32, '0'));
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return {
    iv: iv.toString('hex'),
    encrypted,
    authTag: authTag.toString('hex')
  };
}

function decrypt(encryptedData) {
  if (!encryptedData || !encryptedData.iv || !encryptedData.encrypted) return null;
  
  try {
    const key = Buffer.from(ENCRYPTION_KEY.slice(0, 32).padEnd(32, '0'));
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      key,
      Buffer.from(encryptedData.iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('[CRYPTO] Decryption failed:', error.message);
    return null;
  }
}

// ============================================
// 4. MODÉRATION DE CONTENU
// ============================================

const BANNED_WORDS = [
  // Insultes et harcèlement
  'connard', 'connasse', 'salope', 'pute', 'enculé', 'pd', 'tapette',
  'nique', 'ntm', 'fdp', 'tg', 'ta gueule',
  // Contenu illégal
  'drogue', 'cocaïne', 'héroïne', 'dealer', 'pédophile',
  // Arnaque
  'bitcoin', 'crypto', 'investissement', 'argent facile', 'deviens riche',
  // Contact externe (pour éviter les arnaques)
  'whatsapp', 'telegram', 'mon numéro', 'appelle moi au'
];

const SUSPICIOUS_PATTERNS = [
  /\b\d{10,}\b/g, // Numéros de téléphone
  /\b[\w.-]+@[\w.-]+\.\w{2,}\b/g, // Emails dans messages
  /https?:\/\/[^\s]+/g, // URLs
  /\b(paypal|western union|moneygram)\b/gi,
  /\b(envoie|envoi).{0,20}(argent|€|\$|euro)/gi
];

function moderateContent(text, options = {}) {
  if (!text || typeof text !== 'string') {
    return { safe: true, text };
  }
  
  const result = {
    safe: true,
    warnings: [],
    blocked: false,
    text: text
  };
  
  const lowerText = text.toLowerCase();
  
  // Vérifier les mots bannis
  for (const word of BANNED_WORDS) {
    if (lowerText.includes(word.toLowerCase())) {
      result.safe = false;
      result.blocked = true;
      result.warnings.push(`Contenu interdit: "${word}"`);
      
      if (options.censor) {
        const regex = new RegExp(word, 'gi');
        result.text = result.text.replace(regex, '*'.repeat(word.length));
      }
    }
  }
  
  // Vérifier les patterns suspects
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(text)) {
      result.warnings.push('Pattern suspect détecté');
      if (!options.allowLinks && /https?:\/\//.test(text)) {
        result.safe = false;
        result.text = result.text.replace(/https?:\/\/[^\s]+/g, '[lien supprimé]');
      }
    }
  }
  
  // Vérifier le spam (répétition excessive)
  const words = text.split(/\s+/);
  const wordCount = {};
  for (const word of words) {
    wordCount[word] = (wordCount[word] || 0) + 1;
    if (wordCount[word] > 5) {
      result.warnings.push('Spam détecté (répétition)');
      result.safe = false;
    }
  }
  
  return result;
}

// ============================================
// 5. TRUST SCORE (Score de confiance utilisateur)
// ============================================

const userTrustScores = new Map();

function getUserTrustScore(userId) {
  return userTrustScores.get(userId) || {
    score: 100, // Score initial
    violations: [],
    lastUpdate: Date.now()
  };
}

function updateTrustScore(userId, action, severity = 'minor') {
  let trust = getUserTrustScore(userId);
  
  const penalties = {
    minor: -5,
    moderate: -15,
    severe: -30,
    critical: -50
  };
  
  const bonuses = {
    positive_interaction: +2,
    verified_email: +10,
    verified_phone: +15,
    long_time_user: +5
  };
  
  if (action.startsWith('violation_')) {
    trust.score += penalties[severity] || -5;
    trust.violations.push({
      action,
      severity,
      timestamp: Date.now()
    });
  } else if (bonuses[action]) {
    trust.score += bonuses[action];
  }
  
  // Borner le score entre 0 et 150
  trust.score = Math.max(0, Math.min(150, trust.score));
  trust.lastUpdate = Date.now();
  
  userTrustScores.set(userId, trust);
  
  return trust;
}

function shouldShadowBan(userId) {
  const trust = getUserTrustScore(userId);
  return trust.score < 20;
}

function shouldRequireVerification(userId) {
  const trust = getUserTrustScore(userId);
  return trust.score < 50;
}

// ============================================
// 6. LOGS DE SÉCURITÉ
// ============================================

const securityLogs = [];
const MAX_LOGS = 10000;

function logSecurityEvent(event) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    type: event.type,
    userId: event.userId || 'anonymous',
    ip: event.ip,
    userAgent: event.userAgent,
    action: event.action,
    details: event.details,
    severity: event.severity || 'info'
  };
  
  securityLogs.push(logEntry);
  
  // Garder seulement les derniers logs
  if (securityLogs.length > MAX_LOGS) {
    securityLogs.shift();
  }
  
  // Log console pour les événements critiques
  if (['critical', 'high'].includes(event.severity)) {
    console.error('[SECURITY ALERT]', JSON.stringify(logEntry));
  }
  
  return logEntry;
}

function getSecurityLogs(filters = {}) {
  let logs = [...securityLogs];
  
  if (filters.userId) {
    logs = logs.filter(l => l.userId === filters.userId);
  }
  if (filters.type) {
    logs = logs.filter(l => l.type === filters.type);
  }
  if (filters.severity) {
    logs = logs.filter(l => l.severity === filters.severity);
  }
  if (filters.since) {
    logs = logs.filter(l => new Date(l.timestamp) >= filters.since);
  }
  
  return logs.slice(-100); // Max 100 résultats
}

// ============================================
// 7. PROTECTION ANTI-BRUTE FORCE RENFORCÉE
// ============================================

const loginAttempts = new Map();

function checkBruteForce(identifier, type = 'login') {
  const key = `${type}:${identifier}`;
  const attempts = loginAttempts.get(key) || { count: 0, lastAttempt: 0, blocked: false };
  
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  
  // Reset si fenêtre expirée
  if (now - attempts.lastAttempt > windowMs) {
    attempts.count = 0;
    attempts.blocked = false;
  }
  
  // Limites selon le type
  const limits = {
    login: 5,
    signup: 3,
    passwordReset: 3
  };
  
  if (attempts.count >= (limits[type] || 5)) {
    attempts.blocked = true;
    const remainingTime = Math.ceil((windowMs - (now - attempts.lastAttempt)) / 1000 / 60);
    
    logSecurityEvent({
      type: 'brute_force',
      action: `${type}_blocked`,
      details: { identifier, attempts: attempts.count },
      severity: 'high'
    });
    
    return {
      allowed: false,
      message: `Trop de tentatives. Réessaie dans ${remainingTime} minutes.`,
      remainingMinutes: remainingTime
    };
  }
  
  return { allowed: true };
}

function recordAttempt(identifier, type = 'login', success = false) {
  const key = `${type}:${identifier}`;
  const attempts = loginAttempts.get(key) || { count: 0, lastAttempt: 0, blocked: false };
  
  if (success) {
    loginAttempts.delete(key);
  } else {
    attempts.count++;
    attempts.lastAttempt = Date.now();
    loginAttempts.set(key, attempts);
  }
}

// ============================================
// 8. COOKIES SÉCURISÉS
// ============================================

function setSecureCookie(res, name, value, options = {}) {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
    maxAge: options.maxAge || 86400000, // 24h par défaut
    path: '/',
    ...options
  };
  
  let cookie = `${name}=${value}`;
  
  if (cookieOptions.httpOnly) cookie += '; HttpOnly';
  if (cookieOptions.secure) cookie += '; Secure';
  if (cookieOptions.sameSite) cookie += `; SameSite=${cookieOptions.sameSite}`;
  if (cookieOptions.maxAge) cookie += `; Max-Age=${Math.floor(cookieOptions.maxAge / 1000)}`;
  if (cookieOptions.path) cookie += `; Path=${cookieOptions.path}`;
  
  res.setHeader('Set-Cookie', cookie);
}

// ============================================
// EXPORTS
// ============================================

module.exports = {
  // Validation
  validators,
  validateSchema,
  
  // CSRF
  generateCSRFToken,
  validateCSRFToken,
  
  // Chiffrement
  encrypt,
  decrypt,
  
  // Modération
  moderateContent,
  BANNED_WORDS,
  
  // Trust Score
  getUserTrustScore,
  updateTrustScore,
  shouldShadowBan,
  shouldRequireVerification,
  
  // Logs
  logSecurityEvent,
  getSecurityLogs,
  
  // Anti-brute force
  checkBruteForce,
  recordAttempt,
  
  // Cookies
  setSecureCookie
};
