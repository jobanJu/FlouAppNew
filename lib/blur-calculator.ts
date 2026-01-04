/**
 * lib/blur-calculator.ts
 * Calcule le niveau de flou basé sur le statut du match
 */

export type MatchStatus = 'day1' | 'day2' | 'day3' | 'unmatched' | 'blocked';

export interface MatchInfo {
  status: MatchStatus;
  messages_count_user_1: number;
  messages_count_user_2: number;
  total_messages: number;
}

/**
 * Calcule le niveau de flou pour afficher une photo
 * @param match - Info du match
 * @returns Niveau de flou 0-100 (0 = clair, 100 = complètement flouté)
 */
export const calculateBlurLevel = (match: MatchInfo): number => {
  switch (match.status) {
    case 'day1':
      return 100; // 🌫️ Complètement flouté
    case 'day2':
      return 50; // ⏳ Partiellement flouté (silhouette visible)
    case 'day3':
      return 0; // ✅ Clair et net
    case 'blocked':
    case 'unmatched':
      return 100; // Rester flouté
    default:
      return 100;
  }
};

/**
 * Retourne le badge statut pour afficher à l'utilisateur
 */
export const getBlurBadge = (match: MatchInfo): string => {
  switch (match.status) {
    case 'day1':
      return '🌫️ Jour 1';
    case 'day2':
      return '⏳ Jour 2';
    case 'day3':
      return '✅ Jour 3';
    default:
      return '';
  }
};

/**
 * Calcule le progrès vers le déverrouillage suivant
 */
export const getUnlockProgress = (match: MatchInfo) => {
  const minPerUser = match.status === 'day1' ? 3 : 6;
  const maxPerUser = match.status === 'day1' ? 6 : 12;

  const user1Progress = Math.min(100, (match.messages_count_user_1 / minPerUser) * 100);
  const user2Progress = Math.min(100, (match.messages_count_user_2 / minPerUser) * 100);

  const avgProgress = (user1Progress + user2Progress) / 2;

  return {
    user1: user1Progress,
    user2: user2Progress,
    average: avgProgress,
    messagesNeeded: {
      user1: Math.max(0, minPerUser - match.messages_count_user_1),
      user2: Math.max(0, minPerUser - match.messages_count_user_2),
    },
  };
};

/**
 * Retourne un message encourageant basé sur le progès
 */
export const getUnlockMessage = (match: MatchInfo): string => {
  const progress = getUnlockProgress(match);

  if (match.status === 'day1') {
    return `${progress.messagesNeeded.user1} msgs pour toi, ${progress.messagesNeeded.user2} pour eux`;
  }

  if (match.status === 'day2') {
    return `${progress.messagesNeeded.user1} msgs pour toi, ${progress.messagesNeeded.user2} pour eux → Jour 3 ✨`;
  }

  return 'Photos déverrouillées! 🎉';
};
