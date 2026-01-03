import { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
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

export default function ParallaxScrollView({
  headerBackgroundColor,
  headerImage,
  children,
}: {
  headerBackgroundColor: { dark: string; light: string };
  headerImage?: ReactNode;
  children: ReactNode;
}) {
  const theme = useColorScheme() ?? 'light';
  const backgroundColor = headerBackgroundColor[theme];

  return (
    <ScrollView style={styles.container} scrollEventThrottle={16}>
      <View
        style={[
          styles.header,
          { backgroundColor },
        ]}
      >
        {headerImage}
      </View>
      <View style={styles.content}>
        {children}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 250,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    padding: 32,
    gap: 16,
    overflow: 'hidden',
  },
});
