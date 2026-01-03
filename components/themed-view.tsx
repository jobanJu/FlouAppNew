import { View, ViewProps } from 'react-native';
import { useColorScheme } from '../hooks/use-color-scheme';

const ThemeColors = {
  light: {
    text: '#000',
    background: '#fff',
  },
  dark: {
    text: '#fff',
    background: '#000',
  },
};

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedView({ style, lightColor, darkColor, ...otherProps }: ThemedViewProps) {
  const theme = useColorScheme() ?? 'light';
  const backgroundColor = theme === 'light' ? lightColor : darkColor;

  return (
    <View
      {...otherProps}
      style={[
        { backgroundColor: backgroundColor ?? ThemeColors[theme].background },
        style,
      ]}
    />
  );
}
