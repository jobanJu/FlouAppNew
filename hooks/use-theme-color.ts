import { useColorScheme } from 'react-native';

const ThemeColors = {
  light: {
    text: '#000',
    background: '#fff',
    tint: '#667eea',
    tabIconDefault: '#ccc',
    tabIconSelected: '#667eea',
  },
  dark: {
    text: '#fff',
    background: '#000',
    tint: '#667eea',
    tabIconDefault: '#ccc',
    tabIconSelected: '#667eea',
  },
};

export function useThemeColor(
  colorName: keyof typeof ThemeColors.light & keyof typeof ThemeColors.dark,
  colorOverride?: string,
) {
  const theme = useColorScheme() ?? 'light';
  return colorOverride ?? ThemeColors[theme][colorName];
}
