/**
 * THEME FLOU - Système de design émotionnel et minimaliste
 * Principes : Glassmorphism, flou progressif, focus humain
 */

export const colors = {
  // Dominantes - Gris, bleu nuit, beige chaud
  background: '#fafbfc', // Blanc très léger (base)
  surface: '#f0f0f8', // Gris bleu subtil
  dark: '#1a1a2e', // Bleu nuit

  // Accent principal - Violet discret
  primary: '#6c5ce7', // Violet princier (actions principales)
  primaryLight: 'rgba(108, 92, 231, 0.1)', // Pour backgrounds
  primaryDark: '#5a4ba8',

  // Texte - Hiérarchie émotionnelle
  text: '#1a1a2e',
  textSecondary: '#8b8e9f',
  textMuted: '#b0b3c1',
  textLight: '#d1d5db',
  muted: '#b0b3c1', // Alias for textMuted

  // Borders & UI elements
  border: '#e0e0e8', // Subtle border color
  borderLight: '#ececf1', // Lighter borders

  // États
  success: '#26d07c', // Vert doux (non-agressif)
  warning: '#f0a202', // Or subtil
  error: '#d32f2f', // Rouge discret
  info: '#2196f3', // Bleu informatif

  // Glassmorphism
  glass: 'rgba(255, 255, 255, 0.5)',
  glassLight: 'rgba(255, 255, 255, 0.3)',
  glassDark: 'rgba(255, 255, 255, 0.7)',

  // Brumes - Monnaie émotionnelle
  brume: '#6c5ce7',
  brumeLight: 'rgba(108, 92, 231, 0.2)',

  // Flou progressif
  blur: {
    total: '#ffffff', // Totalement flouté
    partial: 'rgba(255, 255, 255, 0.5)',
    slight: 'rgba(255, 255, 255, 0.2)',
    none: 'transparent',
  },
};

export const typography = {
  // Famille
  fontFamily: 'system',

  // Tailles
  sizes: {
    xs: 11,
    sm: 13,
    base: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    huge: 32,
  },

  // Poids
  weights: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    heavy: '800',
  },

  // Line heights
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};

export const spacing = {
  // Espaces respirants
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const radius = {
  // Arrondi doux (pas de coins durs)
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
};

export const shadows = {
  // Ombres douces (discrétion)
  light: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
};

export default {
  colors,
  typography,
  spacing,
  radius,
  shadows,
};

