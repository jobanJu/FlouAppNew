// ============================================
// SERVICE MATCHING - Algorithme optimisé
// ============================================

const cache = require('./cache.service');
const config = require('../config');

/**
 * Calcule le score de compatibilité entre deux profils
 * @param {Object} user1 
 * @param {Object} user2 
 * @returns {number} Score entre 0 et 100
 */
function calculateCompatibilityScore(user1, user2) {
  let score = 0;
  
  // 1. Compatibilité de recherche (obligatoire)
  if (!isSeekingCompatible(user1, user2)) {
    return 0;
  }
  score += 20; // Base pour compatibilité genre
  
  // 2. Distance (max 30 points)
  if (user1.latitude && user1.longitude && user2.latitude && user2.longitude) {
    const distance = calculateDistance(
      user1.latitude, user1.longitude,
      user2.latitude, user2.longitude
    );
    
    if (distance <= 10) score += 30;
    else if (distance <= 25) score += 25;
    else if (distance <= 50) score += 15;
    else if (distance <= config.matching.maxDistance) score += 5;
    else return 0; // Trop loin
  } else {
    score += 10; // Pas de localisation = score moyen
  }
  
  // 3. Intérêts communs (max 40 points)
  const commonInterests = getCommonInterests(user1.interests, user2.interests);
  if (commonInterests.length < config.matching.minCommonInterests) {
    return 0; // Pas assez d'intérêts communs
  }
  score += Math.min(40, commonInterests.length * 8);
  
  // 4. Différence d'âge (max 10 points)
  const ageDiff = Math.abs(user1.age - user2.age);
  if (ageDiff <= 3) score += 10;
  else if (ageDiff <= 5) score += 8;
  else if (ageDiff <= 10) score += 5;
  else score += 2;
  
  return Math.min(100, score);
}

/**
 * Vérifie la compatibilité de recherche (genre)
 */
function isSeekingCompatible(user1, user2) {
  // User1 cherche user2?
  const user1SeeksUser2 = 
    user1.seeking === 'Les deux' ||
    user1.seeking === user2.gender;
  
  // User2 cherche user1?
  const user2SeeksUser1 = 
    user2.seeking === 'Les deux' ||
    user2.seeking === user1.gender;
  
  return user1SeeksUser2 && user2SeeksUser1;
}

/**
 * Calcule la distance entre deux points GPS (formule Haversine)
 * @returns {number} Distance en km
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Rayon de la Terre en km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}

/**
 * Trouve les intérêts communs
 */
function getCommonInterests(interests1 = [], interests2 = []) {
  const set2 = new Set(interests2.map(i => i.toLowerCase()));
  return interests1.filter(i => set2.has(i.toLowerCase()));
}

/**
 * Génère les matches pour un utilisateur (avec cache)
 * @param {Object} currentUser - L'utilisateur courant
 * @param {Array} allUsers - Tous les utilisateurs potentiels
 * @param {Object} options - Options de filtrage
 * @returns {Array} Liste de profils scorés et triés
 */
async function generateMatches(currentUser, allUsers, options = {}) {
  const cacheKey = `matches:${currentUser.id}`;
  
  // Vérifier le cache
  const cached = await cache.get(cacheKey);
  if (cached && !options.forceRefresh) {
    console.log(`[MATCHING] Cache hit for user ${currentUser.id}`);
    return cached;
  }
  
  console.log(`[MATCHING] Computing matches for user ${currentUser.id}`);
  const startTime = Date.now();
  
  // Filtrer et scorer
  const matches = allUsers
    .filter(user => {
      // Exclure soi-même
      if (user.id === currentUser.id) return false;
      
      // Exclure les utilisateurs déjà likés/passés (à implémenter)
      // if (options.excludeIds?.includes(user.id)) return false;
      
      return true;
    })
    .map(user => ({
      ...user,
      score: calculateCompatibilityScore(currentUser, user),
      distance: (currentUser.latitude && user.latitude) 
        ? Math.round(calculateDistance(
            currentUser.latitude, currentUser.longitude,
            user.latitude, user.longitude
          ))
        : null,
      commonInterests: getCommonInterests(currentUser.interests, user.interests)
    }))
    .filter(match => match.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, options.limit || config.matching.batchSize);
  
  const duration = Date.now() - startTime;
  console.log(`[MATCHING] Computed ${matches.length} matches in ${duration}ms`);
  
  // Mettre en cache
  await cache.set(cacheKey, matches, config.matching.cacheExpiry);
  
  return matches;
}

/**
 * Invalide le cache des matches pour un utilisateur
 */
async function invalidateMatchCache(userId) {
  await cache.del(`matches:${userId}`);
  console.log(`[MATCHING] Cache invalidated for user ${userId}`);
}

/**
 * Invalide le cache de tous les utilisateurs (après changement global)
 */
async function invalidateAllMatchCaches() {
  await cache.delPattern('matches:*');
  console.log('[MATCHING] All match caches invalidated');
}

module.exports = {
  calculateCompatibilityScore,
  calculateDistance,
  getCommonInterests,
  generateMatches,
  invalidateMatchCache,
  invalidateAllMatchCaches,
  isSeekingCompatible
};
