// ============================================
// TURNSTILE VERIFICATION (Anti-bot Cloudflare)
// Alternative gratuite à reCAPTCHA
// ============================================

const config = require('../config');

/**
 * Vérifie un token Turnstile
 * @param {string} token - Token reçu du frontend
 * @param {string} clientIP - IP du client
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function verifyTurnstile(token, clientIP) {
  if (!config.turnstile.enabled) {
    // En dev sans Turnstile, accepter tout
    console.log('[TURNSTILE] Disabled, skipping verification');
    return { success: true };
  }

  if (!token) {
    return { success: false, error: 'Token Turnstile manquant' };
  }

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: config.turnstile.secretKey,
        response: token,
        remoteip: clientIP
      })
    });

    const data = await response.json();

    if (data.success) {
      console.log('[TURNSTILE] Verification successful', { ip: clientIP });
      return { success: true };
    } else {
      console.warn('[TURNSTILE] Verification failed', {
        ip: clientIP,
        errors: data['error-codes']
      });
      return {
        success: false,
        error: 'Vérification anti-bot échouée. Rafraîchis la page.'
      };
    }
  } catch (error) {
    console.error('[TURNSTILE] API Error:', error);
    // En cas d'erreur API, on laisse passer mais on log
    return { success: true, warning: 'Turnstile API unavailable' };
  }
}

/**
 * Middleware Express pour vérifier Turnstile sur certaines routes
 */
function turnstileMiddleware(req, res, next) {
  const token = req.body?.turnstileToken || req.headers['x-turnstile-token'];
  const clientIP = req.headers['cf-connecting-ip'] || 
                   req.headers['x-forwarded-for']?.split(',')[0] ||
                   req.socket?.remoteAddress;

  verifyTurnstile(token, clientIP)
    .then(result => {
      if (result.success) {
        next();
      } else {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Bot Detection',
          message: result.error
        }));
      }
    })
    .catch(err => {
      console.error('[TURNSTILE] Middleware error:', err);
      next(); // En cas d'erreur, on laisse passer
    });
}

module.exports = {
  verifyTurnstile,
  turnstileMiddleware
};
