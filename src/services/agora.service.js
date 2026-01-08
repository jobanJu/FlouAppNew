// ============================================
// SERVICE AGORA - Génération de tokens
// ============================================

const { RtcTokenBuilder, RtcRole } = require('agora-token');
const config = require('../config');

/**
 * Génère un token RTC pour Agora
 * @param {string} channelName - Nom du channel
 * @param {number} uid - User ID (0 pour auto)
 * @param {string} role - 'publisher' ou 'subscriber'
 * @returns {string} Token généré
 */
function generateRtcToken(channelName, uid = 0, role = 'publisher') {
  const agoraRole = role === 'subscriber' ? RtcRole.SUBSCRIBER : RtcRole.PUBLISHER;
  const expireTime = Math.floor(Date.now() / 1000) + config.agora.tokenExpiry;

  const token = RtcTokenBuilder.buildTokenWithUid(
    config.agora.appId,
    config.agora.appCertificate,
    channelName,
    uid,
    agoraRole,
    expireTime
  );

  console.log('[AGORA] Token generated', {
    channel: channelName,
    uid,
    role,
    expiresAt: new Date(expireTime * 1000).toISOString()
  });

  return token;
}

/**
 * Valide un nom de channel
 */
function validateChannelName(channelName) {
  if (!channelName || typeof channelName !== 'string') {
    return { valid: false, error: 'Channel name required' };
  }
  
  // Agora limite: 64 caractères, alphanumeric + quelques spéciaux
  if (channelName.length > 64) {
    return { valid: false, error: 'Channel name too long (max 64)' };
  }
  
  if (!/^[a-zA-Z0-9_-]+$/.test(channelName)) {
    return { valid: false, error: 'Invalid channel name format' };
  }
  
  return { valid: true };
}

module.exports = {
  generateRtcToken,
  validateChannelName,
  appId: config.agora.appId
};
