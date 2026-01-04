/**
 * lib/blur-logic.ts
 * 
 * Logique de défloutage progressif FLOU
 * J1: 100% flouté (photo visible mais flouée)
 * J2: 50% flouté (on voit la silhouette, pas les détails)
 * J3: 0% flouté (photo claire et nette)
 */

/**
 * Types
 */
export type MatchStatus = 'day1' | 'day2' | 'day3' | 'unmatched' | 'blocked';

export interface Match {
  id: string;
  user_1: string;
  user_2: string;
  status: MatchStatus;
  messages_count: number;
  created_at: string;
  day1_unblurred_at?: string;
  day2_unblurred_at?: string;
  day3_unblurred_at?: string;
}

/**
 * FONCTION PRINCIPALE
 * Retourne le niveau de flou (0-100) selon le statut du match
 * 
 * @param match - Données du match
 * @returns Niveau de flou (0-100, où 100 = complètement flouté)
 */
export const getBlurLevel = (match: Match): number => {
  switch (match.status) {
    case 'day1':
      return 100; // Complètement flouté
    case 'day2':
      return 50; // Partiellement flouté
    case 'day3':
      return 0; // Pas de flou
    case 'blocked':
    case 'unmatched':
      return 100; // Rester flouté
    default:
      return 100;
  }
};

/**
 * Détermine si l'utilisateur peut déverrouiller l'image J2
 * Threshold: 3 messages par utilisateur minimum
 * 
 * @param messagesCount - Nombre total de messages dans le match
 * @returns true si threshold atteint
 */
export const canUnlockDay2 = (messagesCount: number): boolean => {
  // 3 messages par personne = 6 messages minimum
  return messagesCount >= 6;
};

/**
 * Détermine si l'utilisateur peut voir la photo claire (J3)
 * Threshold: 6 messages par utilisateur minimum
 * 
 * @param messagesCount - Nombre total de messages dans le match
 * @returns true si threshold atteint
 */
export const canUnlockDay3 = (messagesCount: number): boolean => {
  // 6 messages par personne = 12 messages minimum
  return messagesCount >= 12;
};

/**
 * Calcule le progression du déverrouillage
 * 
 * @param messagesCount - Nombre total de messages
 * @returns { currentLevel: 1|2|3, progressPercent: number }
 */
export const getUnlockProgress = (messagesCount: number): {
  currentLevel: 1 | 2 | 3;
  progressPercent: number;
  nextThreshold: number;
} => {
  if (messagesCount >= 12) {
    return {
      currentLevel: 3,
      progressPercent: 100,
      nextThreshold: 0, // Max level reached
    };
  }

  if (messagesCount >= 6) {
    return {
      currentLevel: 2,
      progressPercent: (messagesCount - 6) / 6 * 100, // 6-12
      nextThreshold: 12,
    };
  }

  return {
    currentLevel: 1,
    progressPercent: messagesCount / 6 * 100, // 0-6
    nextThreshold: 6,
  };
};

/**
 * Détermine le prochain statut de match basé sur les messages
 * 
 * @param currentStatus - Statut actuel
 * @param messagesCount - Nombre de messages
 * @returns Nouveau statut (ou identique si pas de changement)
 */
export const getNextMatchStatus = (
  currentStatus: MatchStatus,
  messagesCount: number
): MatchStatus => {
  if (currentStatus === 'day1' && canUnlockDay2(messagesCount)) {
    return 'day2';
  }

  if (currentStatus === 'day2' && canUnlockDay3(messagesCount)) {
    return 'day3';
  }

  return currentStatus;
};

/**
 * Formate le message de progression pour l'utilisateur
 * 
 * @param messagesCount - Nombre de messages
 * @returns Message user-friendly
 */
export const getUnlockMessage = (messagesCount: number): string => {
  const progress = getUnlockProgress(messagesCount);

  if (progress.currentLevel === 3) {
    return '✅ Photo complètement déverrouillée!';
  }

  if (progress.currentLevel === 2) {
    const remaining = progress.nextThreshold - messagesCount;
    return `Photo partiellement visible. ${remaining} messages pour voir claire.`;
  }

  const remaining = progress.nextThreshold - messagesCount;
  return `${remaining} messages pour voir la silhouette.`;
};

/**
 * Hook React pour utiliser la logique de flou
 * 
 * @param match - Données du match
 * @returns { blurLevel, unlockProgress, unlockMessage, nextStatus }
 */
export const useBlurLogic = (match: Match) => {
  const blurLevel = getBlurLevel(match);
  const unlockProgress = getUnlockProgress(match.messages_count);
  const unlockMessage = getUnlockMessage(match.messages_count);
  const nextStatus = getNextMatchStatus(match.status, match.messages_count);

  return {
    blurLevel,
    unlockProgress,
    unlockMessage,
    nextStatus,
    shouldUpdateStatus: nextStatus !== match.status,
  };
};

/**
 * Exemple d'utilisation:
 * 
 * const match = {
 *   id: '123',
 *   user_1: 'alex',
 *   user_2: 'emma',
 *   status: 'day1',
 *   messages_count: 8,
 * };
 * 
 * const logic = useBlurLogic(match);
 * console.log(logic.blurLevel); // 50 (day2)
 * console.log(logic.unlockMessage); // "Photo partiellement visible. 4 messages pour voir claire."
 */

export default {
  getBlurLevel,
  canUnlockDay2,
  canUnlockDay3,
  getUnlockProgress,
  getNextMatchStatus,
  getUnlockMessage,
  useBlurLogic,
};
