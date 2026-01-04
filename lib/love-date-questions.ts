/**
 * lib/love-date-questions.ts
 * 
 * Questions et réponses pour le système Love Date
 * Format: 1v1 avec timer 1m30s par question
 * 6/10 réponses correctes = déverrouillage instant J3
 */

export type LoveQuestion = {
  id: number;
  fr: string;
  en: string;
  category: 'values' | 'lifestyle' | 'ambitions' | 'personality';
};

export type LoveAnswer = {
  id: string;
  fr: string;
  en: string;
  weight: number; // -1 (totally wrong), 0 (neutral), 1 (perfect match)
};

/**
 * QUESTIONS LOVE DATE
 * 10 questions pour découvrir la vraie compatibilité
 */
export const LOVE_QUESTIONS: LoveQuestion[] = [
  {
    id: 1,
    fr: 'Où voudrais-tu être dans 5 ans?',
    en: 'Where do you see yourself in 5 years?',
    category: 'ambitions',
  },
  {
    id: 2,
    fr: 'Qu\'est-ce qui te fait vraiment rire?',
    en: 'What makes you truly laugh?',
    category: 'personality',
  },
  {
    id: 3,
    fr: 'Quel voyage t\'a le plus changé?',
    en: 'Which trip changed you the most?',
    category: 'lifestyle',
  },
  {
    id: 4,
    fr: 'Comment définis-tu l\'amour?',
    en: 'How do you define love?',
    category: 'values',
  },
  {
    id: 5,
    fr: 'Quel moment quotidien te rend heureux?',
    en: 'What daily moment makes you happy?',
    category: 'lifestyle',
  },
  {
    id: 6,
    fr: 'Quelle valeur est la plus importante pour toi?',
    en: 'What value matters most to you?',
    category: 'values',
  },
  {
    id: 7,
    fr: 'Si tu avais une journée libre, que ferais-tu?',
    en: 'If you had a free day, what would you do?',
    category: 'lifestyle',
  },
  {
    id: 8,
    fr: 'Quel rêve sembles-tu avoir oublié?',
    en: 'What dream do you think you forgot?',
    category: 'ambitions',
  },
  {
    id: 9,
    fr: 'Comment gères-tu les conflits?',
    en: 'How do you handle conflict?',
    category: 'personality',
  },
  {
    id: 10,
    fr: 'Qu\'est-ce qui te rend vulnérable?',
    en: 'What makes you vulnerable?',
    category: 'values',
  },
];

/**
 * RÉPONSES POSSIBLES PAR CATÉGORIE
 * Chaque réponse a un weight pour calculer la compatibilité
 */

export const AMBITIONS_ANSWERS: LoveAnswer[] = [
  {
    id: 'amb_1',
    fr: 'Voyager & explorer le monde',
    en: 'Travel & explore the world',
    weight: 1,
  },
  {
    id: 'amb_2',
    fr: 'Construire quelque chose de significatif',
    en: 'Build something meaningful',
    weight: 1,
  },
  {
    id: 'amb_3',
    fr: 'Trouver la stabilité & la sécurité',
    en: 'Find stability & security',
    weight: 0,
  },
  {
    id: 'amb_4',
    fr: 'Vivre libre sans engagements',
    en: 'Live free without commitments',
    weight: -1,
  },
];

export const LIFESTYLE_ANSWERS: LoveAnswer[] = [
  {
    id: 'life_1',
    fr: 'Sortir & rencontrer des gens',
    en: 'Go out & meet people',
    weight: 1,
  },
  {
    id: 'life_2',
    fr: 'Moment de calme & introspection',
    en: 'Quiet moment & introspection',
    weight: 1,
  },
  {
    id: 'life_3',
    fr: 'Être en nature & dehors',
    en: 'Be in nature & outdoors',
    weight: 0,
  },
  {
    id: 'life_4',
    fr: 'Rester chez soi & se reposer',
    en: 'Stay home & relax',
    weight: 0,
  },
];

export const VALUES_ANSWERS: LoveAnswer[] = [
  {
    id: 'val_1',
    fr: 'L\'authenticité & l\'honnêteté',
    en: 'Authenticity & honesty',
    weight: 1,
  },
  {
    id: 'val_2',
    fr: 'La croissance personnelle',
    en: 'Personal growth',
    weight: 1,
  },
  {
    id: 'val_3',
    fr: 'La famille & les traditions',
    en: 'Family & traditions',
    weight: 0,
  },
  {
    id: 'val_4',
    fr: 'L\'indépendance & la liberté',
    en: 'Independence & freedom',
    weight: -1,
  },
];

export const PERSONALITY_ANSWERS: LoveAnswer[] = [
  {
    id: 'pers_1',
    fr: 'Conversation profonde & honnête',
    en: 'Deep & honest conversation',
    weight: 1,
  },
  {
    id: 'pers_2',
    fr: 'Humour spontané & absurde',
    en: 'Spontaneous & absurd humor',
    weight: 1,
  },
  {
    id: 'pers_3',
    fr: 'Calme & stabilité émotionnelle',
    en: 'Calmness & emotional stability',
    weight: 0,
  },
  {
    id: 'pers_4',
    fr: 'Passion & intensité',
    en: 'Passion & intensity',
    weight: 0,
  },
];

/**
 * Récupère les réponses possibles pour une question
 */
export const getAnswersForQuestion = (questionId: number): LoveAnswer[] => {
  const question = LOVE_QUESTIONS[questionId - 1];

  switch (question.category) {
    case 'ambitions':
      return AMBITIONS_ANSWERS;
    case 'lifestyle':
      return LIFESTYLE_ANSWERS;
    case 'values':
      return VALUES_ANSWERS;
    case 'personality':
      return PERSONALITY_ANSWERS;
    default:
      return [];
  }
};

/**
 * Calcule la compatibilité entre deux ensembles de réponses
 * @param answers1 - Réponses de l'utilisateur 1
 * @param answers2 - Réponses de l'utilisateur 2
 * @returns { matchCount, score, compatible }
 */
export const calculateCompatibility = (
  answers1: Record<number, string>,
  answers2: Record<number, string>
): {
  matchCount: number;
  totalQuestions: number;
  scorePercent: number;
  compatible: boolean; // 6/10 = true
} => {
  let matchCount = 0;
  const totalQuestions = LOVE_QUESTIONS.length;

  // Pour chaque question, vérifier la compatibilité
  for (let i = 1; i <= totalQuestions; i++) {
    const answer1Id = answers1[i];
    const answer2Id = answers2[i];

    if (!answer1Id || !answer2Id) continue;

    const question = LOVE_QUESTIONS[i - 1];
    const possibleAnswers = getAnswersForQuestion(i);

    const ans1 = possibleAnswers.find((a) => a.id === answer1Id);
    const ans2 = possibleAnswers.find((a) => a.id === answer2Id);

    if (!ans1 || !ans2) continue;

    // Simple logic: même réponse ou weight similaire = match
    if (answer1Id === answer2Id || (ans1.weight > -1 && ans2.weight > -1)) {
      matchCount++;
    }
  }

  const scorePercent = (matchCount / totalQuestions) * 100;
  const compatible = matchCount >= 6; // 6/10 minimum

  return {
    matchCount,
    totalQuestions,
    scorePercent,
    compatible,
  };
};

/**
 * Génère un message de résultat Love Date
 */
export const getLoveDateVerdictMessage = (
  matchCount: number,
  compatible: boolean
): string => {
  if (matchCount === 10) {
    return '💜 SOULMATE! Compatibilité parfaite!';
  }

  if (matchCount >= 8) {
    return '✨ Excellente compatibilité! Continuez...';
  }

  if (matchCount >= 6) {
    return '💘 Match valide! Vous vous comprenez bien.';
  }

  if (matchCount >= 4) {
    return '🤔 Potentiel... Mais pas assez de compatibilité.';
  }

  return '👋 Pas de match cette fois. À bientôt!';
};

/**
 * Timer Love Date
 */
export const LOVE_DATE_SETTINGS = {
  TIMER_DURATION: 90, // 1m30s par question
  TOTAL_QUESTIONS: 10,
  MIN_MATCHES_TO_PASS: 6,
  UNLOCK_J3_INSTANTLY: true, // J3 déverrouille si 6/10
};

/**
 * Exemple d'utilisation:
 * 
 * const question = LOVE_QUESTIONS[0];
 * const answers = getAnswersForQuestion(question.id);
 * 
 * // Après réponses des 2 utilisateurs:
 * const result = calculateCompatibility(user1Answers, user2Answers);
 * const message = getLoveDateVerdictMessage(result.matchCount, result.compatible);
 */

export default {
  LOVE_QUESTIONS,
  AMBITIONS_ANSWERS,
  LIFESTYLE_ANSWERS,
  VALUES_ANSWERS,
  PERSONALITY_ANSWERS,
  getAnswersForQuestion,
  calculateCompatibility,
  getLoveDateVerdictMessage,
  LOVE_DATE_SETTINGS,
};
