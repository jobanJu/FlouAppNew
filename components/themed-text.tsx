import { Text, TextProps } from 'react-native';
import { useColorScheme } from '../hooks/use-color-scheme';

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

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'subtitle' | 'defaultSemiBold';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const theme = useColorScheme() ?? 'light';
  const color = theme === 'light' ? lightColor : darkColor;

  return (
    <Text
      {...rest}
      style={[
        { color: color ?? ThemeColors[theme].text },
        type === 'default' && { fontSize: 16 },
        type === 'defaultSemiBold' && { fontSize: 16, fontWeight: '600' },
        type === 'title' && { fontSize: 32, fontWeight: 'bold' },
        type === 'subtitle' && { fontSize: 20, fontWeight: '600' },
        style,
      ]}
    />
  );
}
