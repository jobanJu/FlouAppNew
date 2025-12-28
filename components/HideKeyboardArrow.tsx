import React from 'react';
import { TouchableOpacity, Keyboard, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function HideKeyboardArrow({ style }: { style?: any }) {
  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        onPress={Keyboard.dismiss}
        accessibilityLabel="Masquer le clavier"
        style={styles.button}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="chevron-down" size={28} color="#888" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-end',
    marginRight: 8,
    marginTop: 2,
  },
  button: {
    padding: 4,
  },
});
